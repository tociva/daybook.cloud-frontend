import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlDeleteButtonComponent } from '../../../../../../shared/burl-delete-button/burl-delete-button.component';
import { BurlEditButtonComponent } from '../../../../../../shared/burl-edit-button/burl-edit-button.component';
import {
  PURCHASE_INVOICE_DETAIL_INCLUDES,
  PurchaseInvoiceStore,
} from '../../../data/purchase-invoice';
import { PurchaseInvoiceDraftStore } from '../create-purchase-invoice/purchase-invoice-draft.store';
import { PiVendorComponent } from '../create-purchase-invoice/pi-vendor/pi-vendor.component';
import { PiInvoiceDetailsComponent } from '../create-purchase-invoice/pi-invoice-details/pi-invoice-details.component';
import { PiLineItemsComponent } from '../create-purchase-invoice/pi-line-items/pi-line-items.component';

@Component({
  selector: 'app-view-purchase-invoice',
  standalone: true,
  providers: [PurchaseInvoiceDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlDeleteButtonComponent,
    BurlEditButtonComponent,
    PiVendorComponent,
    PiLineItemsComponent,
    PiInvoiceDetailsComponent,
  ],
  templateUrl: './view-purchase-invoice.component.html',
  styleUrl: './view-purchase-invoice.component.css',
})
export class ViewPurchaseInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  protected readonly draft = inject(PurchaseInvoiceDraftStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseInvoiceStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    const cached = this.purchaseInvoiceStore.selectedItem();
    if (cached?.id === id) this.draft.patchFromInvoice(cached);

    const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, {
      includes: PURCHASE_INVOICE_DETAIL_INCLUDES,
    });
    if (invoice) this.draft.patchFromInvoice(invoice);
  }

  protected editInvoice(): void {
    const id = this.purchaseInvoiceStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/purchase-invoice', id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteInvoice(): void {
    const id = this.purchaseInvoiceStore.selectedItem()?.id;
    if (id) {
      void this.router.navigate(['/app/trading/purchase-invoice', id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
