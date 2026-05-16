import { Component, computed, inject } from '@angular/core';
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
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { CustomerStore } from '../../../data/customer';
import type { Customer } from '../../../data/customer';
import { SaleInvoiceStore } from '../../../data/sale-invoice';
import type { SaleInvoice } from '../../../data/sale-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';

@Component({
  selector: 'app-list-sale-invoice',
  standalone: true,
  imports: [
    PageHeadingComponent,
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
export class ListSaleInvoiceComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly hasError = computed(() => this.saleInvoiceStore.error() !== null);
  protected readonly customerOptionValue = (option: unknown): string =>
    (option as Customer).id ?? '';
  protected readonly customerOptionLabel = (option: unknown): string =>
    (option as Customer).name ?? '';
  protected readonly customerTrackBy = (_index: number, option: unknown): unknown => {
    const customer = option as Customer;

    return customer.id ?? customer.name;
  };

  protected readonly columns: readonly TngTableColumn<SaleInvoice>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '10rem' },
    { id: 'customer', label: 'Customer', width: '14rem' },
    { id: 'date', label: 'Date', sortable: true, width: '9rem' },
    { id: 'itemtotal', label: 'Item Total', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'discount', label: 'Discount', align: 'end', headerAlign: 'end', width: '8rem' },
    { id: 'tax', label: 'Tax', align: 'end', headerAlign: 'end', width: '8rem' },
    {
      id: 'grandtotal',
      label: 'Grand Total',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '10rem',
    },
    { id: 'received', label: 'Received', align: 'end', headerAlign: 'end', width: '10rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Invoice number', type: 'text' },
    {
      id: 'customerid',
      label: 'Customer',
      placeholder: 'Search customer',
      type: 'autocomplete',
      options: () => this.customerStore.items() as readonly Customer[],
      getOptionValue: this.customerOptionValue,
      getOptionLabel: this.customerOptionLabel,
      trackBy: this.customerTrackBy,
      queryChange: (query) => this.searchCustomers(query),
    },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
      fiscalYear: true,
      operators: ['between', '=', '>=', '<='],
    },
    {
      id: 'duedate',
      label: 'Due Date',
      type: 'date',
      operators: ['between', '=', '>=', '<='],
    },
    {
      id: 'grandtotal',
      label: 'Grand Total',
      placeholder: 'Amount',
      step: '0.01',
      type: 'number',
      operators: ['between', '=', '>=', '<='],
    },
  ];

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  protected formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return value.toFixed(2);
  }

  /** Returns empty string for zero/absent values — used for optional columns like tax and discount. */
  protected formatOptionalAmount(value: number | undefined): string {
    if (value === undefined || value === null || value === 0) return '';
    return value.toFixed(2);
  }

  /** Sum of all receipt-link amounts for the invoice. Returns undefined when no receipts are linked. */
  protected totalReceived(row: SaleInvoice): number | undefined {
    if (!row.receipts?.length) return undefined;
    return row.receipts.reduce((sum, r) => sum + r.amount, 0);
  }

  /** True when the sum of receipts covers the grand total in full. */
  protected isPaid(row: SaleInvoice): boolean {
    const grandtotal = row.grandtotal ?? 0;
    if (grandtotal <= 0) return false;
    const received = row.receipts?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    return received >= grandtotal;
  }

  /** True when there is an outstanding balance and the due date has passed. */
  protected isOverdue(row: SaleInvoice): boolean {
    if (this.isPaid(row) || !row.duedate) return false;
    return new Date() > new Date(row.duedate);
  }

  constructor() {
    void this.customerStore.loadCustomers({});
    this.crudQuery.init(
      (filter) =>
        void this.saleInvoiceStore.loadSaleInvoices({
          ...filter,
          includes: ['customer', 'receipts'],
        }),
    );
  }

  private searchCustomers(query: string): void {
    const q = query.trim();

    void this.customerStore.loadCustomers(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  /** Navigate to new receipt pre-linked to this invoice. */
  protected createReceiptForInvoice(item: SaleInvoice): void {
    this.saleInvoiceStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/customer-receipt/create'], {
      queryParams: { saleinvoiceid: item.id, burl: this.router.url },
    });
  }

  /** Navigate to the customer receipt that covers this invoice (first receipt). */
  protected viewReceiptForInvoice(item: SaleInvoice): void {
    const receiptId = item.receipts?.[0]?.customerreceiptid;
    if (receiptId) {
      void this.router.navigate(['/app/trading/customer-receipt', receiptId], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected createSaleInvoice(): void {
    void this.router.navigate(['/app/trading/sale-invoice/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      this.saleInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/sale-invoice', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      this.saleInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/sale-invoice', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteSaleInvoice(item: SaleInvoice): void {
    if (item.id) {
      this.saleInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/sale-invoice', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
