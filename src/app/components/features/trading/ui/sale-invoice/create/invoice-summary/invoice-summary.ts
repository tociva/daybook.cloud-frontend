import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SaleInvoiceSummaryForm, SaleInvoiceTaxDisplayModeType } from '../../util/sale-invoice-form.type';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';

@Component({
  selector: 'app-invoice-summary',
  imports: [ReactiveFormsModule, NumberInputDirective],
  templateUrl: './invoice-summary.html',
  styleUrl: './invoice-summary.css'
})
export class InvoiceSummary {

  readonly form = input.required<FormGroup<SaleInvoiceSummaryForm>>();
  readonly taxDisplayMode = input.required<SaleInvoiceTaxDisplayModeType>();
  readonly showDiscount = input.required<boolean>();
  readonly onRoundoffChange = output<void>();
  readonly showTax = computed(() => {
    const mode = this.taxDisplayMode();
    return ![SaleInvoiceTaxDisplayModeType.NON_TAXABLE].includes(mode);
  });

  readonly handleRoundoffChange = () => this.onRoundoffChange.emit();
}
