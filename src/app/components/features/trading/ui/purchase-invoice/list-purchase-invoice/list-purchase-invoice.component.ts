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
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { VendorStore } from '../../../data/vendor';
import type { Vendor } from '../../../data/vendor';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';

@Component({
  selector: 'app-list-purchase-invoice',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-purchase-invoice.component.html',
  styleUrl: './list-purchase-invoice.component.css',
  providers: [CrudListQueryService],
})
export class ListPurchaseInvoiceComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  protected readonly hasError = computed(() => this.purchaseInvoiceStore.error() !== null);

  protected readonly vendorOptionValue = (option: unknown): string =>
    (option as Vendor).id ?? '';
  protected readonly vendorOptionLabel = (option: unknown): string =>
    (option as Vendor).name ?? '';
  protected readonly vendorTrackBy = (_index: number, option: unknown): unknown => {
    const vendor = option as Vendor;
    return vendor.id ?? vendor.name;
  };

  protected readonly columns: readonly TngTableColumn<PurchaseInvoice>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '10rem' },
    { id: 'vendor', label: 'Vendor', width: '14rem' },
    { id: 'date', label: 'Date', sortable: true, width: '9rem' },
    { id: 'duedate', label: 'Due Date', sortable: true, width: '9rem' },
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
    { id: 'paid', label: 'Paid', align: 'end', headerAlign: 'end', width: '10rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Invoice number', type: 'text' },
    {
      id: 'vendorid',
      label: 'Vendor',
      placeholder: 'Search vendor',
      type: 'autocomplete',
      options: () => this.vendorStore.items() as readonly Vendor[],
      getOptionValue: this.vendorOptionValue,
      getOptionLabel: this.vendorOptionLabel,
      trackBy: this.vendorTrackBy,
      queryChange: (query) => this.searchVendors(query),
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

  protected formatOptionalAmount(value: number | undefined): string {
    if (value === undefined || value === null || value === 0) return '';
    return value.toFixed(2);
  }

  /** Sum of payment amounts linked to this invoice. */
  protected totalPaid(row: PurchaseInvoice): number | undefined {
    if (!row.payments?.length) return undefined;
    return row.payments.reduce((sum, p) => sum + p.amount, 0);
  }

  protected isPaid(row: PurchaseInvoice): boolean {
    const grandtotal = row.grandtotal ?? 0;
    if (grandtotal <= 0) return false;
    const paid = row.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    return paid >= grandtotal;
  }

  protected isOverdue(row: PurchaseInvoice): boolean {
    if (this.isPaid(row) || !row.duedate) return false;
    return new Date() > new Date(row.duedate);
  }

  constructor() {
    void this.vendorStore.loadVendors({});
    this.crudQuery.init(
      (filter) =>
        void this.purchaseInvoiceStore.loadPurchaseInvoices({
          ...filter,
          includes: ['vendor', 'payments'],
        }),
    );
  }

  private searchVendors(query: string): void {
    const q = query.trim();
    void this.vendorStore.loadVendors(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected createPurchaseInvoice(): void {
    void this.router.navigate(['/app/trading/purchase-invoice/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadPurchaseInvoices(): void {
    void this.purchaseInvoiceStore.loadPurchaseInvoices({
      ...this.crudQuery.filter(),
      includes: ['vendor', 'payments'],
    });
  }

  protected viewPurchaseInvoice(item: PurchaseInvoice): void {
    if (item.id) {
      this.purchaseInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-invoice', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editPurchaseInvoice(item: PurchaseInvoice): void {
    if (item.id) {
      this.purchaseInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-invoice', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deletePurchaseInvoice(item: PurchaseInvoice): void {
    if (item.id) {
      this.purchaseInvoiceStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-invoice', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
