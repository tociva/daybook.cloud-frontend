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
  TngSwitchComponent,
} from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { SaleInvoiceDraftStore, type SelectOption } from '../sale-invoice-draft.store';

@Component({
  selector: 'app-si-invoice-details',
  standalone: true,
  imports: [
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    TngInputComponent,
    TngLabelComponent,
    TngSelectComponent,
    TngSwitchComponent,
  ],
  templateUrl: './si-invoice-details.component.html',
  styleUrl: './si-invoice-details.component.css',
})
export class SiInvoiceDetailsComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
  private readonly dateManagement = inject(DateManagementService);
  readonly readOnly = input(false);

  readonly getOptionLabel = (o: SelectOption): string => o.label;
  readonly getOptionValue = (o: SelectOption): string => o.value;
  readonly trackByValue = (_: number, o: SelectOption): string => o.value;

  protected formatDate(value: string): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }
}
