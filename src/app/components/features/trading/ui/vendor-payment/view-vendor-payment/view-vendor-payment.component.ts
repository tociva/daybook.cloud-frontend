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
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { PurchaseInvoicePayment, VendorPayment } from '../../../data/vendor-payment';
import { VendorPaymentStore } from '../../../data/vendor-payment';

@Component({
  selector: 'app-view-vendor-payment',
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
  templateUrl: './view-vendor-payment.component.html',
  styleUrl: '../../customer-receipt/view-customer-receipt/view-customer-receipt.component.css',
})
export class ViewVendorPaymentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly permissions = inject(PermissionsStore);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  private readonly paymentId = signal<string | null>(null);

  protected readonly payment = computed(() => {
    const item = this.vendorPaymentStore.selectedItem();
    return item?.id === this.paymentId() ? item : null;
  });
  protected readonly canViewPurchaseInvoice = computed(() =>
    this.permissions.can(PERMISSION.branch.purchaseInvoice.view),
  );

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.vendorPaymentStore.clearError();
    const id = this.route.snapshot.paramMap.get('id');
    this.paymentId.set(id);
    if (!id) return;

    await this.vendorPaymentStore.loadVendorPaymentById(id, {
      includes: [
        'vendor',
        'bcash',
        { relation: 'invoices', scope: { include: [{ relation: 'purchaseinvoice' }] } },
      ],
    });
  }

  protected editPayment(): void {
    const id = this.payment()?.id;
    if (id) void this.router.navigate(['/app/trading/vendor-payment', id, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deletePayment(): void {
    const id = this.payment()?.id;
    if (id) void this.router.navigate(['/app/trading/vendor-payment', id, 'delete'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewPurchaseInvoice(invoice: PurchaseInvoicePayment): void {
    if (!this.canViewPurchaseInvoice()) return;
    const id = this.invoiceRouteId(invoice);
    if (id) void this.router.navigate(['/app/trading/purchase-invoice', id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected linkedInvoices(payment: VendorPayment): readonly PurchaseInvoicePayment[] {
    return payment.invoices ?? [];
  }

  protected invoiceRouteId(invoice: PurchaseInvoicePayment): string {
    return invoice.purchaseinvoice?.id ?? invoice.purchaseinvoiceid ?? '';
  }

  protected invoiceNumber(invoice: PurchaseInvoicePayment): string {
    return invoice.purchaseinvoice?.number ?? invoice.purchaseinvoiceid ?? '—';
  }

  protected formatDate(value: string | undefined | null): string {
    return this.dateManagement.formatDisplayDate(value ?? undefined, '—');
  }

  protected formatAmount(amount: number | undefined | null, currencycode?: string | null): string {
    return formatAmountWithCurrency(amount, currencycode);
  }

  protected formatLocalAmount(payment: VendorPayment): string {
    return formatAmountWithCurrency(
      payment.cprops?.['lamt'] as number | undefined,
      this.userSessionStore.session()?.branch?.currencycode,
    );
  }

  protected formatRate(value: unknown): string {
    return typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : '—';
  }
}
