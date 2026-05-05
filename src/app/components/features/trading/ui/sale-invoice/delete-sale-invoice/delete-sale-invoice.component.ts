import { Component, OnInit, inject, signal } from '@angular/core';
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
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { SaleInvoiceStore } from '../../../data/sale-invoice';
import { formatDisplayDate } from '../../../../../../core/date/dayjs-date.utils';

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
export class DeleteSaleInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly confirmed = signal(false);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: ['customer'],
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

  protected async deleteInvoice(): Promise<void> {
    const id = this.saleInvoiceStore.selectedItem()?.id;
    if (!id || !this.confirmed()) return;

    const deleted = await this.saleInvoiceStore.deleteSaleInvoice(id);
    if (deleted) {
      await this.burlNavigation.navigateBack();
    }
  }
}
