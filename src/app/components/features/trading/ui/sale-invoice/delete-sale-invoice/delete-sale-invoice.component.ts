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
import { SaleInvoiceFacade, SaleInvoiceStore } from '../../../data/sale-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';

@Component({
  selector: 'app-delete-sale-invoice',
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
  templateUrl: './delete-sale-invoice.component.html',
  styleUrl: './delete-sale-invoice.component.css',
})
export class DeleteSaleInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(SaleInvoiceFacade);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly confirmed = signal(false);

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: ['customer'],
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

  protected async deleteInvoice(): Promise<void> {
    const id = this.saleInvoiceStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    await this.facade.delete(id);
  }
}
