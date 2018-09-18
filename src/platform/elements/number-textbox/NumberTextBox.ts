// NG
import { Component, Input, ViewChild, forwardRef, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
// App
import { NovoLabelService } from '../../services/novo-label-service';
import { Helpers } from '../../utils/Helpers';
import { FormValidators } from '../form/FormValidators';

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
    <input *ngIf="subType !== 'percentage'" type="text" [attr.name]="name" [class.maxlength-error]="invalidMaxlength" [class.invalid]="invalid" (keydown)="_handleKeydown($event)" 
      (input)="_handleInput($event)" (mousewheel)="numberInput.blur()" #input data-automation-id="novo-number-textbox-input"/>
    <input *ngIf="subType === 'percentage'" type="text" [attr.name]="name" [class.maxlength-error]="invalidMaxlength" [class.invalid]="invalid" (keydown)="_handleKeydown($event)"
      (input)="_handleInput($event, true)" [placeholder]="placeholder" (mousewheel)="percentInput.blur()" #percentInput data-automation-id="novo-number-textbox-input"/>
  `,
})
export class NovoNumberTextBoxElement implements ControlValueAccessor {
  @Input()
  config: any;
  @Input()
  name: string;
  @Input()
  subType: string;
  @Input()
  placeholder: string;
  @Input()
  value: number;

  private _decimalSeparator: string = '.'; // defaults to period
  private numbersWithDecimalRegex: any;
  private invalidMaxlength: boolean = false;
  private invalid: boolean = false;

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

  _handleKeydown(event: KeyboardEvent): void {
    this.restrictKeys(event);
  }

  _handleInput(event: KeyboardEvent, isPercent: boolean = false): void {
    if (document.activeElement === event.target) {
      let value = (event.target as HTMLInputElement).value;
      let parsedValue = this.replaceDecimalSeperatorAndParse(this.decimalSeparator, value);
      this.isInvalid(parsedValue, value.length);
      if (isPercent) {
        this._handlePercentInput(value, parsedValue);
      } else {
        this._setValue(value, parsedValue);
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

  private _setValue(displayValue: any, parsedValue: any) {
    this.value = parsedValue;
    this._onChange(this.value);
    if (this.input && this.input.nativeElement) {
      // TODO: it's null when this is called through writeValue - need to figure out if this is a problem
      this.input.nativeElement.value = displayValue;
    }
    this._changeDetectorRef.markForCheck();
  }

  private _handlePercentInput(value: any, parsedValue: any) {
    let percent = Helpers.isEmpty(parsedValue) ? null : Number((parsedValue / 100).toFixed(6).replace(/\.?0*$/, ''));
    if (!Helpers.isEmpty(percent)) {
      this._setValue(percent, value);
    } else {
      this._setValue(null, '');
    }
  }

  /**
   * replace decimal separator with period and parse
   */
  private replaceDecimalSeperatorAndParse(decimalSeparator: string, value: any): any {
    let parsedValue = value;
    if (decimalSeparator && decimalSeparator !== '.' && value) {
      parsedValue = parseFloat(value.replace(decimalSeparator, '.'));
    }
    if (isNaN(Number(parsedValue))) {
      return '';
    } else {
      return parsedValue;
    }
  }

  private isInvalid(value: any, strLength: number) {
    this.invalidMaxlength = false;
    this.invalid = false;

    if (strLength > 0 && (value === null || value === '')) {
      this.invalid = true;
      return;
    }

    switch (this.subType) {
      case 'number':
      case 'currency':
        if (FormValidators.maxInteger({ value: value }) !== null) {
          this.invalidMaxlength = true;
        }
        break;
      case 'float':
      case 'percentage':
        if (FormValidators.maxDouble({ value: value }) !== null) {
          this.invalidMaxlength = true;
        }
        break;
      case 'year':
        if (FormValidators.minYear({ value: value }) !== null) {
          this.invalid = true;
        }
        break;
    }
  }

  get decimalSeparator(): any {
    return this._decimalSeparator;
  }

  @Input()
  set decimalSeparator(value: any) {
    if (value) {
      this._decimalSeparator = value;
    }
    this.numbersWithDecimalRegex = new RegExp('[0-9\\' + this.decimalSeparator + ']');
  }
}
