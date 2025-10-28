import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PurchaseInvoiceSummaryForm, PurchaseInvoiceTaxDisplayModeType } from '../../util/purchase-invoice-form.type';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';

@Component({
  selector: 'app-purchase-invoice-summary',
  imports: [ReactiveFormsModule, NumberInputDirective],
  templateUrl: './purchase-invoice-summary.html',
  styleUrl: './purchase-invoice-summary.css'
})
export class PurchaseInvoiceSummary {

  readonly form = input.required<FormGroup<PurchaseInvoiceSummaryForm>>();
  readonly taxDisplayMode = input.required<PurchaseInvoiceTaxDisplayModeType>();
  readonly showDiscount = input.required<boolean>();
  readonly onRoundoffChange = output<void>();
  readonly showTax = computed(() => {
    const mode = this.taxDisplayMode();
    return ![PurchaseInvoiceTaxDisplayModeType.NON_TAXABLE].includes(mode);
  });

  readonly handleRoundoffChange = () => this.onRoundoffChange.emit();
}

