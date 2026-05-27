import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import {
  SALE_INVOICE_DETAIL_INCLUDES,
  SaleInvoicePrintService,
  SaleInvoiceStore,
} from '../../../data/sale-invoice';
import { SaleInvoiceDraftStore } from '../create-sale-invoice/sale-invoice-draft.store';
import { SiCustomerComponent } from '../create-sale-invoice/si-customer/si-customer.component';
import { SiInvoiceDetailsComponent } from '../create-sale-invoice/si-invoice-details/si-invoice-details.component';
import { SiLineItemsComponent } from '../create-sale-invoice/si-line-items/si-line-items.component';

@Component({
  selector: 'app-view-sale-invoice',
  standalone: true,
  providers: [SaleInvoiceDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
    TngButtonComponent,
    TngIcon,
    SiCustomerComponent,
    SiLineItemsComponent,
    SiInvoiceDetailsComponent,
  ],
  templateUrl: './view-sale-invoice.component.html',
  styleUrl: './view-sale-invoice.component.css',
})
export class ViewSaleInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly printService = inject(SaleInvoicePrintService);
  private readonly toastStore = inject(ToastStore);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly draft = inject(SaleInvoiceDraftStore);
  protected readonly isPreviewingPdf = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.saleInvoiceStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Instant render: if the list set selectedItem before navigating, patch the
    // draft immediately so the page appears populated before the API responds.
    const cached = this.saleInvoiceStore.selectedItem();
    if (cached?.id === id) this.draft.patchFromInvoice(cached);

    // Always fetch full detail — the list response omits line items, addresses, etc.
    const invoice = await this.saleInvoiceStore.loadSaleInvoiceById(id, {
      includes: SALE_INVOICE_DETAIL_INCLUDES,
    });
    if (invoice) this.draft.patchFromInvoice(invoice);
  }

  protected editInvoice(): void {
    const id = this.saleInvoiceStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/sale-invoice', id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteInvoice(): void {
    const id = this.saleInvoiceStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/sale-invoice', id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected async previewInvoicePdf(): Promise<void> {
    const invoice = this.saleInvoiceStore.selectedItem();
    const id = invoice?.id ?? this.route.snapshot.paramMap.get('id');
    if (!id || this.isPreviewingPdf()) return;

    this.isPreviewingPdf.set(true);
    try {
      await this.printService.previewInvoicePdf(invoice ?? id);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to prepare invoice PDF.'));
    } finally {
      this.isPreviewingPdf.set(false);
    }
  }
}
