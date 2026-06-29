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
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import {
  XlsxExportButtonComponent,
  columnsFromTable,
  createCrudListXlsxDocument,
  date,
  number,
  readPath,
  text,
} from '../../../../../../shared/xlsx-export';
import { PurchaseReturnService, PurchaseReturnStore } from '../../../data/purchase-return';
import type { PurchaseReturn } from '../../../data/purchase-return';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-purchase-return',
  standalone: true,
  imports: [
    CanDirective,
    PageHeadingComponent,
    BurlBackButtonComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    XlsxExportButtonComponent,
  ],
  templateUrl: './list-purchase-return.component.html',
  styleUrl: './list-purchase-return.component.css',
  providers: [CrudListQueryService],
})
export class ListPurchaseReturnComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly purchaseReturnService = inject(PurchaseReturnService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly purchaseReturnStore = inject(PurchaseReturnStore);
  protected readonly hasError = computed(() => this.purchaseReturnStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<PurchaseReturn>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '10rem' },
    { id: 'invoice', label: 'Purchase Invoice', width: '12rem' },
    { id: 'vendor', label: 'Vendor', width: '12rem' },
    { id: 'date', label: 'Date', sortable: true, width: '9rem' },
    { id: 'duedate', label: 'Due Date', sortable: true, width: '9rem' },
    { id: 'itemtotal', label: 'Item Total', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'tax', label: 'Tax', align: 'end', headerAlign: 'end', width: '8rem' },
    {
      id: 'grandtotal',
      label: 'Grand Total',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '10rem',
    },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Return number', type: 'text' },
    {
      id: 'date',
      label: 'Date',
      type: 'date',
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

  constructor() {
    this.crudQuery.init(
      (filter) =>
        void this.purchaseReturnStore.loadPurchaseReturns({
          ...filter,
          includes: [
            {
              relation: 'purchaseinvoice',
              scope: { include: [{ relation: 'vendor' }] },
            },
          ],
        }),
    );
  }

  protected readonly exportPurchaseReturns = () =>
    createCrudListXlsxDocument({
      cachedRows: this.purchaseReturnStore.items(),
      cachedTotal: this.purchaseReturnStore.count(),
      columns: columnsFromTable(this.columns),
      count: (query) => this.purchaseReturnService.count(query),
      fileNameBase: 'purchase-returns',
      list: (query) =>
        this.purchaseReturnService.list({
          ...query,
          includes: [
            {
              relation: 'purchaseinvoice',
              scope: { include: [{ relation: 'vendor' }] },
            },
          ],
        }),
      mapRow: (row) => [
        text(row.number),
        text(readPath(row, 'purchaseinvoice.number')),
        text(readPath(row, 'purchaseinvoice.vendor.name')),
        date(row.date),
        date(row.duedate),
        number(row.itemtotal),
        number(row.tax),
        number(row.grandtotal),
      ],
      query: this.crudQuery.filter(),
      sheetName: 'Purchase Returns',
      title: 'Purchase Returns',
    });

  protected createPurchaseReturn(): void {
    void this.router.navigate(['/app/trading/purchase-return/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewPurchaseReturn(item: PurchaseReturn): void {
    if (item.id) {
      this.purchaseReturnStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-return', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editPurchaseReturn(item: PurchaseReturn): void {
    if (item.id) {
      this.purchaseReturnStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-return', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deletePurchaseReturn(item: PurchaseReturn): void {
    if (item.id) {
      this.purchaseReturnStore.setSelectedItem(item);
      void this.router.navigate(['/app/trading/purchase-return', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
