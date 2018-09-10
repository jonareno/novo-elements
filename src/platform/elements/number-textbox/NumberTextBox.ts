// NG
import { Component, Input, ViewChild, forwardRef, ElementRef, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
// App
import { NovoLabelService } from '../../services/novo-label-service';
import { Helpers } from '../../utils/Helpers';

// Value accessor for the component (supports ngModel)
const NUMBER_TEXTBOX_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NovoNumberTextBoxElement),
  multi: true,
};

@Component({
  selector: 'novo-number-textbox',
  providers: [NUMBER_TEXTBOX_VALUE_ACCESSOR],
  template: `
    <input *ngIf="subType !== 'percentage'" type="text" [attr.name]="name" (keydown)="_handleKeydown($event)" (input)="_handleInput($event)" #input data-automation-id="novo-number-textbox-input"/>
    <input *ngIf="subType === 'percentage'" type="text" [attr.name]="name" (keydown)="_handleKeydown($event)" 
      (input)="_handleInput($event, true)" [placeholder]="placeholder" step="any" (mousewheel)="percentInput.blur()" #percentInput data-automation-id="novo-number-textbox-input"/>
  `,
})
export class NovoNumberTextBoxElement implements ControlValueAccessor, OnInit {
  @Input()
  config: any;
  @Input()
  name: string;
  @Input()
  subType: string;
  @Input()
  placeholder: string;
  @Input()
  maxlength: number;
  @Input()
  value: number;

  decimalPoint: string = '.'; // defaults to a period
  numbersWithDecimalRegex: any;

  /** View -> model callback called when value changes */
  _onChange: (value: any) => void = () => {};

  /** View -> model callback called when autocomplete has been touched */
  _onTouched = () => {};

  /** Element for the panel containing the autocomplete options. */
  @ViewChild('input')
  input: any;

  constructor(
    public element: ElementRef,
    public labels: NovoLabelService,
    private _changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    if (this.config && this.config.decimalPoint) {
      this.decimalPoint = this.config.decimalPoint;
    }
    this.numbersWithDecimalRegex = new RegExp('[0-9\\' + this.decimalPoint + ']');
  }

  _handleKeydown(event: KeyboardEvent): void {
    this.restrictKeys(event);
  }

  _handleInput(event: KeyboardEvent, isPercent: boolean = false): void {
    if (document.activeElement === event.target) {
      let value = (event.target as HTMLInputElement).value;
      if (isPercent) {
        this._handlePercentInput(value);
      } else {
        this._setValue(this.parseNumber(value), value);
      }
    }
  }

  restrictKeys(event) {
    const NUMBERS_ONLY = /[0-9\-]/;
    const UTILITY_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    let key = event.key;
    if (this.subType === 'number' && !(NUMBERS_ONLY.test(key) || UTILITY_KEYS.includes(key))) {
      event.preventDefault();
    } else if (
      ~['currency', 'float', 'percentage'].indexOf(this.subType) &&
      !(this.numbersWithDecimalRegex.test(key) || UTILITY_KEYS.includes(key))
    ) {
      event.preventDefault();
    }
  }

  writeValue(value: any): void {
    this._setValue(value, value);
  }
  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }

  private _setValue(value: number, displayValue: any) {
    this.value = value;
    this._onChange(this.value);
    if (this.input && this.input.nativeElement) {
      // TODO: it's null when this is called through writeValue - need to figure out if this is a problem
      this.input.nativeElement.value = displayValue;
    }
    this._changeDetectorRef.markForCheck();
  }

  private _handlePercentInput(value: any) {
    let numberValue = this.parseNumber(value);
    let percent = Helpers.isEmpty(numberValue) ? null : Number((numberValue / 100).toFixed(6).replace(/\.?0*$/, ''));
    if (!Helpers.isEmpty(percent)) {
      this._setValue(percent, value);
    } else {
      this._setValue(null, '');
    }
  }

  private parseNumber(value: any): number {
    // replace decimal separator with period and parse
    let parsedValue = value.replace(this.decimalPoint, '.');
    parsedValue = parseFloat(parsedValue);
    return parsedValue;
  }
}
