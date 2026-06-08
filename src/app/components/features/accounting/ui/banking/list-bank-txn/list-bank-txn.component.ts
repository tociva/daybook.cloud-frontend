import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
} from '../../../../../../shared/crud';
import type { CrudFilterField } from '../../../../../../shared/crud';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { BankCashStore } from '../../../../trading/data/bank-cash';
import { InventoryLedgerMapStore } from '../../../data/inventory-ledger-map';
import { BankTxnStore } from '../../../data/bank-txn';
import type { BankTxn } from '../../../data/bank-txn';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { BankStatementUploadComponent } from '../bank-statement-upload/bank-statement-upload.component';

@Component({
  selector: 'app-list-bank-txn',
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
    TableRowIconButtonComponent,
    BankStatementUploadComponent,
  ],
  templateUrl: './list-bank-txn.component.html',
  styleUrl: './list-bank-txn.component.css',
  providers: [CrudListQueryService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListBankTxnComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankTxnStore = inject(BankTxnStore);
  protected readonly inventoryLedgerMapStore = inject(InventoryLedgerMapStore);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly hasError = computed(() => this.bankTxnStore.error() !== null);

  protected readonly columns: readonly TngTableColumn<BankTxn>[] = [
    { id: 'txndate', label: 'Date', sortable: true, width: '9rem' },
    { id: 'bank', label: 'Bank', width: '14rem' },
    { id: 'description', label: 'Description', sortable: true, truncate: true },
    { id: 'bankref', label: 'Reference', sortable: true, width: '12rem' },
    {
      id: 'debit',
      label: 'Inflow',
      align: 'end',
      headerAlign: 'end',
      sortable: true,
      width: '9rem',
    },
    {
      id: 'credit',
      label: 'Outflow',
      align: 'end',
      headerAlign: 'end',
      sortable: true,
      width: '9rem',
    },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '8rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'txndate', label: 'Date', defaultOperator: 'between', type: 'date' },
    { id: 'inventoryledgermapid', label: 'Bank ledger map', placeholder: 'Map id', type: 'text' },
    { id: 'description', label: 'Description', placeholder: 'Narration text', type: 'text' },
    { id: 'bankref', label: 'Reference', placeholder: 'UTR / cheque no', type: 'text' },
  ];

  private readonly bankNameByMapId = computed(() => {
    const banksById = new Map(this.bankCashStore.items().map((item) => [item.id, item.name]));
    return new Map(
      this.inventoryLedgerMapStore
        .items()
        .filter((map) => map.id)
        .map((map) => [
          map.id as string,
          map.entityid ? (banksById.get(map.entityid) ?? map.entityid) : (map.id as string),
        ]),
    );
  });

  constructor() {
    this.crudQuery.init((filter) => {
      void this.bankTxnStore.loadBankTxns({
        ...filter,
        includes: ['inventoryledgermap', 'matches'],
        order: filter.order?.length ? filter.order : ['txndate DESC'],
      });
    });

    void Promise.all([
      this.inventoryLedgerMapStore.loadInventoryLedgerMaps({
        limit: 1000,
        offset: 0,
        where: { entitytype: 'bankCash', ledgertype: 'bank' },
      }),
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
    ]);
  }

  protected createBankTxn(): void {
    void this.router.navigate(['/app/accounting/banking/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected viewBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteBankTxn(item: BankTxn): void {
    if (item.id) {
      void this.router.navigate(['/app/accounting/banking', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected reloadBankTxns(): void {
    void this.bankTxnStore.loadBankTxns({
      ...this.crudQuery.filter(),
      includes: ['inventoryledgermap', 'matches'],
    });
  }

  protected bankName(item: BankTxn): string {
    const mapId = item.inventoryledgermapid;
    return this.bankNameByMapId().get(mapId) ?? item.inventoryledgermap?.entityid ?? mapId;
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(value: number | undefined): string {
    const amount = Number(value ?? 0);
    return amount > 0
      ? new Intl.NumberFormat('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(amount)
      : '';
  }
}
