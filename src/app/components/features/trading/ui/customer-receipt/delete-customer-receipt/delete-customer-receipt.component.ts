import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { formatDisplayDate } from '../../../../../../core/date/dayjs-date.utils';
import { CustomerReceiptFacade, CustomerReceiptStore } from '../../../data/customer-receipt';

@Component({
  selector: 'app-delete-customer-receipt',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    TngIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './delete-customer-receipt.component.html',
  styleUrl: './delete-customer-receipt.component.css',
})
export class DeleteCustomerReceiptComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CustomerReceiptFacade);
  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.customerReceiptStore.loadCustomerReceiptById(id, {
        includes: ['customer', 'bcash'],
      });
    }
  }

  protected formatDate(value: string | undefined): string {
    if (!value) return '—';
    return formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  protected async deleteReceipt(): Promise<void> {
    const id = this.customerReceiptStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
