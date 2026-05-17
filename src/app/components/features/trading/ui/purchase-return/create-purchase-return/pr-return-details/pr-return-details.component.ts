import { Component, inject, input } from '@angular/core';
import {
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngDatepickerComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { DatepickerDateAdapterService } from '../../../../../../../core/date/datepicker-date-adapter.service';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { FiscalYearDatepickerComponent } from '../../../../../../../shared/fiscal-year-datepicker';
import { PurchaseReturnDraftStore, type SelectOption } from '../purchase-return-draft.store';

@Component({
  selector: 'app-pr-return-details',
  standalone: true,
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    FiscalYearDatepickerComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngTextareaComponent,
  ],
  templateUrl: './pr-return-details.component.html',
  styleUrl: './pr-return-details.component.css',
})
export class PrReturnDetailsComponent {
  protected readonly draft = inject(PurchaseReturnDraftStore);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  private readonly dateManagement = inject(DateManagementService);
  readonly readOnly = input(false);

  readonly getOptionLabel = (o: SelectOption): string => o.label;
  readonly getOptionValue = (o: SelectOption): string => o.value;
  readonly trackByValue = (_: number, o: SelectOption): string => o.value;

  protected formatDate(value: string): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }
}
