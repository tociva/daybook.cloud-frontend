import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { SaleInvoiceStore } from '../../../data/sale-invoice';
import type { SaleInvoice } from '../../../data/sale-invoice';
import { formatDisplayDate } from '../../../../../../core/date/dayjs-date.utils';

@Component({
  selector: 'app-list-sale-invoice',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './list-sale-invoice.component.html',
  styleUrl: './list-sale-invoice.component.css',
  providers: [CrudListQueryService],
})
export class ListSaleInvoiceComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly hasError = computed(() => this.saleInvoiceStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<SaleInvoice>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '10rem' },
    { id: 'customer', label: 'Customer', width: '14rem' },
    { id: 'date', label: 'Date', sortable: true, width: '9rem' },
    { id: 'itemtotal', label: 'Item Total', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'discount', label: 'Discount', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'tax', label: 'Tax', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'grandtotal', label: 'Grand Total', sortable: true, align: 'end', headerAlign: 'end', width: '10rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Invoice number', type: 'text' },
  ];

  protected formatDate(value: string | undefined): string {
    if (!value) return '—';
    return formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  ngOnInit(): void {
    this.crudQuery.init((filter) =>
      void this.saleInvoiceStore.loadSaleInvoices({
        ...filter,
        includes: ['customer'],
      }),
    );
  }

  protected createSaleInvoice(): void {
    void this.router.navigate(['/app/trading/sale-invoice/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/sale-invoice', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/sale-invoice', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/sale-invoice', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
