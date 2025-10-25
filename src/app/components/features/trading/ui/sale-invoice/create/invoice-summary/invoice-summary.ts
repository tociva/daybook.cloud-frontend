import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SaleInvoiceSummaryForm } from '../../util/sale-invoice-form.type';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';

@Component({
  selector: 'app-invoice-summary',
  imports: [ReactiveFormsModule, NumberInputDirective],
  templateUrl: './invoice-summary.html',
  styleUrl: './invoice-summary.css'
})
export class InvoiceSummary {

  readonly form = input.required<FormGroup<SaleInvoiceSummaryForm>>();
  readonly onRoundoffChange = output<void>();

  readonly handleRoundoffChange = () => this.onRoundoffChange.emit();
}
