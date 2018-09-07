// NG
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// App
import { NovoNumberTextBoxElement } from './NumberTextBox';

@NgModule({
  imports: [CommonModule],
  declarations: [NovoNumberTextBoxElement],
  exports: [NovoNumberTextBoxElement],
})
export class NovoNumberTextBoxModule {}
