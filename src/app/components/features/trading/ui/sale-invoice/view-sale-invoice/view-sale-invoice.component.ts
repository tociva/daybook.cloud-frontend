import { Component, inject } from '@angular/core';
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
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { Router } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { SALE_INVOICE_DETAIL_INCLUDES, SaleInvoiceStore } from '../../../data/sale-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-view-sale-invoice',
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
    TngIcon,
    BurlBackButtonComponent,
  ],
  templateUrl: './view-sale-invoice.component.html',
  styleUrl: './view-sale-invoice.component.css',
})
export class ViewSaleInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: SALE_INVOICE_DETAIL_INCLUDES,
      });
    }
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
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
