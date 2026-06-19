import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngProgressSpinnerComponent,
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
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { BankCashStore } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { CustomerStore } from '../../../data/customer';
import type { Customer } from '../../../data/customer';
import { CustomerReceiptStore } from '../../../data/customer-receipt';
import type { CustomerReceipt, CustomerReceiptJournal } from '../../../data/customer-receipt';
import { CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG } from './customer-receipt-bulk-upload.config';

const DEFAULT_CUSTOMER_RECEIPT_ORDER = ['date ASC'] as const;

@Component({
  selector: 'app-list-customer-receipt',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    CrudFilterPopoverComponent,
    CrudPaginatorComponent,
    TngIcon,
    EmptyStateComponent,
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-customer-receipt.component.html',
  styleUrl: './list-customer-receipt.component.css',
  providers: [CrudListQueryService],
})
export class ListCustomerReceiptComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly toastStore = inject(ToastStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  protected readonly bulkUploadConfig = CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG;
  protected readonly hasError = computed(() => this.customerReceiptStore.error() !== null);
  protected readonly generatingJournalReceiptId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByReceiptId = signal<Map<string, readonly CustomerReceiptJournal[]>>(
    new Map(),
  );
  protected readonly customerOptionValue = (option: unknown): string =>
    (option as Customer).id ?? '';
  protected readonly customerOptionLabel = (option: unknown): string =>
    (option as Customer).name ?? '';
  protected readonly customerTrackBy = (_index: number, option: unknown): unknown => {
    const customer = option as Customer;

    return customer.id ?? customer.name;
  };
  protected readonly bankCashOptionValue = (option: unknown): string =>
    (option as BankCash).id ?? '';
  protected readonly bankCashOptionLabel = (option: unknown): string =>
    (option as BankCash).name ?? '';
  protected readonly bankCashTrackBy = (_index: number, option: unknown): unknown => {
    const bankCash = option as BankCash;

    return bankCash.id ?? bankCash.name;
  };

  protected readonly columns: readonly TngTableColumn<CustomerReceipt>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '12rem' },
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'customer', label: 'Customer', width: '14rem' },
    {
      id: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'end',
      headerAlign: 'end',
      width: '12rem',
    },
    { id: 'bcash', label: 'Bank/Cash', width: '12rem' },
    { id: 'description', label: 'Description', width: '16rem' },
    { id: 'journals', label: 'Journals', width: '12rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '10rem' },
  ];

  protected readonly filterFields: readonly CrudFilterField[] = [
    { id: 'number', label: 'Number', placeholder: 'Search receipt number', type: 'text' },
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
      operators: ['between', '=', '>=', '<='],
    },
    {
      id: 'amount',
      label: 'Amount',
      placeholder: 'Amount',
      step: '0.01',
      type: 'number',
      operators: ['between', '=', '>=', '<='],
    },
    {
      id: 'bcashid',
      label: 'Bank/Cash',
      placeholder: 'Search bank/cash',
      type: 'autocomplete',
      options: () => this.bankCashStore.items() as readonly BankCash[],
      getOptionValue: this.bankCashOptionValue,
      getOptionLabel: this.bankCashOptionLabel,
      trackBy: this.bankCashTrackBy,
      queryChange: (query) => this.searchBankCash(query),
    },
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  constructor() {
    void this.customerStore.loadCustomers({});
    void this.bankCashStore.loadBankCashes({});
    this.crudQuery.init((filter) => this.loadCustomerReceiptsWithJournals(filter));
  }

  private async loadCustomerReceiptsWithJournals(filter: Lb4ListQuery): Promise<void> {
    await this.customerReceiptStore.loadCustomerReceipts({
      ...filter,
      order: filter.order?.length ? filter.order : DEFAULT_CUSTOMER_RECEIPT_ORDER,
      includes: ['customer', 'bcash'],
    });
    if (this.customerReceiptStore.error()) {
      this.journalsByReceiptId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.customerReceiptStore.items());
  }

  private async loadLinkedJournals(receipts: readonly CustomerReceipt[]): Promise<void> {
    const ids = receipts.map((receipt) => receipt.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByReceiptId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.RECEIPT,
        ids,
      );
      const map = new Map<string, readonly CustomerReceiptJournal[]>();
      for (const group of groups) {
        map.set(group.sourceid, group.journals);
      }
      this.journalsByReceiptId.set(map);
    } catch {
      this.journalsByReceiptId.set(new Map());
    } finally {
      this.journalsLoading.set(false);
    }
  }

  protected linkedJournals(row: CustomerReceipt): readonly CustomerReceiptJournal[] {
    const id = row.id;
    if (!id) return [];
    return this.journalsByReceiptId().get(id) ?? [];
  }

  protected hasJournals(row: CustomerReceipt): boolean {
    return this.linkedJournals(row).length > 0;
  }

  protected viewJournal(journal: CustomerReceiptJournal): void {
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async generateJournal(row: CustomerReceipt): Promise<void> {
    if (!row.id || this.generatingJournalReceiptId() === row.id) return;

    this.generatingJournalReceiptId.set(row.id);
    try {
      const journal = await this.journalService.createFromCustomerReceipt(row.id);
      this.toastStore.success('Journal generated.');
      const ref: CustomerReceiptJournal = { id: journal.id, number: journal.number };
      const map = new Map(this.journalsByReceiptId());
      map.set(row.id, [ref]);
      this.journalsByReceiptId.set(map);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to generate journal.'));
    } finally {
      this.generatingJournalReceiptId.set(null);
    }
  }

  private searchCustomers(query: string): void {
    const q = query.trim();

    void this.customerStore.loadCustomers(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  private searchBankCash(query: string): void {
    const q = query.trim();

    void this.bankCashStore.loadBankCashes(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected createReceipt(): void {
    void this.router.navigate(['/app/trading/customer-receipt/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadCustomerReceipts(): void {
    void this.loadCustomerReceiptsWithJournals(this.crudQuery.filter());
  }

  protected viewReceipt(item: CustomerReceipt): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer-receipt', item.id], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected editReceipt(item: CustomerReceipt): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer-receipt', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected deleteReceipt(item: CustomerReceipt): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/customer-receipt', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
