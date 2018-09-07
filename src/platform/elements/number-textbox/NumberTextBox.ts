// NG
import { Component, Input, ViewChild, forwardRef, ElementRef, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
// App
import { NovoLabelService } from '../../services/novo-label-service';

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
    <input type="text" [attr.name]="name" (keydown)="_handleKeydown($event)" (input)="_handleInput($event)" #input data-automation-id="novo-number-textbox-input"/>
  `,
})
export class NovoNumberTextBoxElement implements ControlValueAccessor, OnInit {
  @Input()
  config: any;
  @Input()
  name: string;
  @Input()
  subType: string;
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
    if (this.config.decimalPoint) {
      this.decimalPoint = this.config.decimalPoint;
    }
    this.numbersWithDecimalRegex = new RegExp('[0-9\\' + this.decimalPoint + ']');
  }

  _handleKeydown(event: KeyboardEvent): void {
    this.restrictKeys(event);
  }

  _handleInput(event: KeyboardEvent): void {
    if (document.activeElement === event.target) {
      let newValue = (event.target as HTMLInputElement).value;
      this._setValue(newValue);
    }
  }

  restrictKeys(event) {
    const NUMBERS_ONLY = /[0-9\-]/;
    const UTILITY_KEYS = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];

    let key = event.key;
    if (this.subType === 'number' && !(NUMBERS_ONLY.test(key) || UTILITY_KEYS.includes(key))) {
      event.preventDefault();
    } else if (~['currency', 'float'].indexOf(this.subType) && !(this.numbersWithDecimalRegex.test(key) || UTILITY_KEYS.includes(key))) {
      event.preventDefault();
    }
  }

  writeValue(value: any): void {
    this._setValue(value);
  }
  registerOnChange(fn: (value: any) => {}): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => {}) {
    this._onTouched = fn;
  }

  private _setValue(value: any): void {
    // replace decimal separator with period and parse
    let newValue = value.replace(this.decimalPoint, '.');
    this.value = parseFloat(newValue);
    this._onChange(this.value);

    this.input.nativeElement.value = value;
    //this._changeDetectorRef.markForCheck(); // what is this for?
  }
}
