import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PurchaseReturnSummaryForm, PurchaseReturnTaxDisplayModeType } from '../../util/purchase-return-form.type';
import { NumberInputDirective } from '../../../../../../../util/directives/number-input.directive';

@Component({
  selector: 'app-purchase-return-summary',
  imports: [ReactiveFormsModule, NumberInputDirective],
  templateUrl: './purchase-return-summary.html',
  styleUrl: './purchase-return-summary.css'
})
export class PurchaseReturnSummary {

  readonly form = input.required<FormGroup<PurchaseReturnSummaryForm>>();
  readonly taxDisplayMode = input.required<PurchaseReturnTaxDisplayModeType>();
  readonly onRoundoffChange = output<void>();
  readonly showTax = computed(() => {
    const mode = this.taxDisplayMode();
    return ![PurchaseReturnTaxDisplayModeType.NON_TAXABLE].includes(mode);
  });

  readonly handleRoundoffChange = () => this.onRoundoffChange.emit();
}

