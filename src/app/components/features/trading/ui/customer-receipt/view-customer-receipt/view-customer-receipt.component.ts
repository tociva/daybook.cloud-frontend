import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
} from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { UserSessionStore } from '../../../../../features/management/data/user-session/user-session.store';
import {
  CUSTOMER_RECEIPT_DETAIL_INCLUDES,
  CustomerReceiptStore,
} from '../../../data/customer-receipt';
import type { CustomerReceipt, SaleInvoiceReceipt } from '../../../data/customer-receipt';

@Component({
  selector: 'app-view-customer-receipt',
  standalone: true,
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
  ],
  templateUrl: './view-customer-receipt.component.html',
  styleUrl: './view-customer-receipt.component.css',
})
export class ViewCustomerReceiptComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  private readonly receiptId = signal<string | null>(null);

  protected readonly receipt = computed(() => {
    const item = this.customerReceiptStore.selectedItem();
    return item?.id === this.receiptId() ? item : null;
  });

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.customerReceiptStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    this.receiptId.set(id);
    if (!id) return;

    await this.customerReceiptStore.loadCustomerReceiptById(id, {
      includes: CUSTOMER_RECEIPT_DETAIL_INCLUDES,
    });
  }

  protected editReceipt(): void {
    const id = this.receipt()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/customer-receipt', id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteReceipt(): void {
    const id = this.receipt()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/customer-receipt', id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected viewSaleInvoice(invoice: SaleInvoiceReceipt): void {
    const id = this.invoiceRouteId(invoice);
    if (id) {
      void this.router.navigate(['/app/trading/sale-invoice', id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected linkedInvoices(receipt: CustomerReceipt): readonly SaleInvoiceReceipt[] {
    return receipt.invoices ?? [];
  }

  protected invoiceRouteId(invoice: SaleInvoiceReceipt): string {
    return invoice.saleinvoice?.id ?? invoice.saleinvoiceid ?? '';
  }

  protected invoiceNumber(invoice: SaleInvoiceReceipt): string {
    return invoice.saleinvoice?.number ?? invoice.saleinvoiceid ?? '—';
  }

  protected formatDate(value: string | undefined | null): string {
    return this.dateManagement.formatDisplayDate(value ?? undefined, '—');
  }

  protected formatAmount(amount: number | undefined | null, currencycode?: string | null): string {
    return formatAmountWithCurrency(amount, currencycode);
  }

  protected formatLocalAmount(receipt: CustomerReceipt): string {
    const amount = receipt.cprops?.lamt;
    const currencycode = this.userSessionStore.session()?.branch?.currencycode ?? null;
    return formatAmountWithCurrency(amount, currencycode);
  }

  protected formatRate(value: number | undefined | null): string {
    if (value === undefined || value === null) return '—';
    return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }
}
