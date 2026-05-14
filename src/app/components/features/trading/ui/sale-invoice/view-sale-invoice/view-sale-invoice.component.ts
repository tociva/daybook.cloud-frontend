import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { SALE_INVOICE_DETAIL_INCLUDES, SaleInvoiceStore } from '../../../data/sale-invoice';
import { SaleInvoiceDraftStore } from '../create-sale-invoice/sale-invoice-draft.store';
import { SiCustomerComponent } from '../create-sale-invoice/si-customer/si-customer.component';
import { SiInvoiceDetailsComponent } from '../create-sale-invoice/si-invoice-details/si-invoice-details.component';
import { SiLineItemsComponent } from '../create-sale-invoice/si-line-items/si-line-items.component';

@Component({
  selector: 'app-view-sale-invoice',
  standalone: true,
  providers: [SaleInvoiceDraftStore],
  imports: [
    TngButtonComponent,
    TngIcon,
    BurlBackButtonComponent,
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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const invoice = await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: SALE_INVOICE_DETAIL_INCLUDES,
      });
      if (invoice) this.draft.patchFromInvoice(invoice);
    }
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
}
