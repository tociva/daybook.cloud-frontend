import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import { SALE_INVOICE_DETAIL_INCLUDES, SaleInvoiceStore } from '../../../data/sale-invoice';
import type { SaleInvoice } from '../../../data/sale-invoice';
import type { StoredDocument } from '../../../data/invoice-document';
import { InvoiceAttachmentsComponent } from '../../shared/invoice-attachments/invoice-attachments.component';
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
    InvoiceAttachmentsComponent,
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
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly draft = inject(SaleInvoiceDraftStore);

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

  protected onDocumentsChanged(documents: readonly StoredDocument[]): void {
    const invoice = this.saleInvoiceStore.selectedItem();
    if (!invoice) return;
    this.saleInvoiceStore.setSelectedItem({
      ...invoice,
      documentids: documents.map((document) => document.id).filter((id): id is string => !!id),
      documents,
    } satisfies SaleInvoice);
  }
}
