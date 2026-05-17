import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngCheckboxComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { PurchaseInvoiceFacade, PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-delete-purchase-invoice',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngCheckboxComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
  ],
  templateUrl: './delete-purchase-invoice.component.html',
  styleUrl: './delete-purchase-invoice.component.css',
})
export class DeletePurchaseInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseInvoiceFacade);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    if (this.purchaseInvoiceStore.selectedItem()?.id === id) return;

    await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, { includes: ['vendor'] });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  protected async deleteInvoice(): Promise<void> {
    const id = this.purchaseInvoiceStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
