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
import type { SaleInvoiceListQuery } from '../../../data/sale-invoice/sale-invoice.model';
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { CustomerStore } from '../../../data/customer';
import type { Customer } from '../../../data/customer';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import {
  JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS,
  JOURNAL_LINK_STATUS_FILTER_FIELD,
} from '../../../../accounting/shared/journal-link-status-filter';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { SaleInvoicePrintService, SaleInvoiceStore } from '../../../data/sale-invoice';
import type { SaleInvoice, SaleInvoiceJournal } from '../../../data/sale-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { SALE_INVOICE_BULK_UPLOAD_CONFIG } from './sale-invoice-bulk-upload.config';
import { SaleInvoiceBulkUploadValidationService } from './sale-invoice-bulk-upload-validation.service';
import { validateSaleInvoiceBulkUploadPayload } from './sale-invoice-bulk-upload.validator';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';

const DEFAULT_SALE_INVOICE_ORDER = ['date ASC', 'number ASC'] as const;

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
    EmptyStateComponent,
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-sale-invoice.component.html',
  styleUrl: './list-sale-invoice.component.css',
  providers: [CrudListQueryService],
})
export class ListSaleInvoiceComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly printService = inject(SaleInvoicePrintService);
  private readonly toastStore = inject(ToastStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private readonly bulkUploadValidationService = inject(SaleInvoiceBulkUploadValidationService);
  protected readonly bulkUploadConfig = computed<BulkUploadPreviewConfig>(() => ({
    ...SALE_INVOICE_BULK_UPLOAD_CONFIG,
    prepareValidation: () => this.bulkUploadValidationService.prepare(),
    validatePayload: (payload) =>
      validateSaleInvoiceBulkUploadPayload(payload, {
        minorUnit: this.bulkUploadValidationService.branchMinorUnit(),
      }),
    validatePayloadAsync: (payload) => this.bulkUploadValidationService.validateReferences(payload),
  }));
  protected readonly hasError = computed(() => this.saleInvoiceStore.error() !== null);
  protected readonly filterClearQueryParams = JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS;
  protected readonly pageTitle = computed(() => 'Sale Invoices');
  protected readonly pageDescription = computed(() =>
    'Manage your sale invoices and billing records.',
  );
  protected readonly previewingInvoiceId = signal<string | null>(null);
  protected readonly generatingJournalInvoiceId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByInvoiceId = signal<Map<string, readonly SaleInvoiceJournal[]>>(
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
    { id: 'journals', label: 'Journals', width: '12rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '12rem' },
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
    JOURNAL_LINK_STATUS_FILTER_FIELD,
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
    this.crudQuery.init((filter) => this.loadSaleInvoicesWithJournals(filter));
  }

  private async loadSaleInvoicesWithJournals(filter: Lb4ListQuery): Promise<void> {
    const query: SaleInvoiceListQuery = {
      ...filter,
      order: filter.order?.length ? filter.order : DEFAULT_SALE_INVOICE_ORDER,
      includes: ['customer', 'receipts'],
    };
    await this.saleInvoiceStore.loadSaleInvoices(query);
    if (this.saleInvoiceStore.error()) {
      this.journalsByInvoiceId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.saleInvoiceStore.items());
  }

  private async loadLinkedJournals(invoices: readonly SaleInvoice[]): Promise<void> {
    const ids = invoices.map((invoice) => invoice.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByInvoiceId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.SALE_INVOICE,
        ids,
      );
      const map = new Map<string, readonly SaleInvoiceJournal[]>();
      for (const group of groups) {
        map.set(group.sourceid, group.journals);
      }
      this.journalsByInvoiceId.set(map);
    } catch {
      this.journalsByInvoiceId.set(new Map());
    } finally {
      this.journalsLoading.set(false);
    }
  }

  protected linkedJournals(row: SaleInvoice): readonly SaleInvoiceJournal[] {
    const id = row.id;
    if (!id) return [];
    return this.journalsByInvoiceId().get(id) ?? [];
  }

  protected hasJournals(row: SaleInvoice): boolean {
    return this.linkedJournals(row).length > 0;
  }

  protected viewJournal(journal: SaleInvoiceJournal): void {
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async generateJournal(row: SaleInvoice): Promise<void> {
    if (!row.id || this.generatingJournalInvoiceId() === row.id) return;

    this.generatingJournalInvoiceId.set(row.id);
    try {
      const journal = await this.journalService.createFromSaleInvoice(row.id);
      this.toastStore.success('Journal generated.');
      const ref: SaleInvoiceJournal = { id: journal.id, number: journal.number };
      const map = new Map(this.journalsByInvoiceId());
      map.set(row.id, [ref]);
      this.journalsByInvoiceId.set(map);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to generate journal.'));
    } finally {
      this.generatingJournalInvoiceId.set(null);
    }
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

  /** Navigate to all customer receipts linked to this invoice. */
  protected viewReceiptsForInvoice(item: SaleInvoice): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/sale-invoice', item.id, 'receipts'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected createSaleInvoice(): void {
    void this.router.navigate(['/app/trading/sale-invoice/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadSaleInvoices(): void {
    void this.loadSaleInvoicesWithJournals(this.crudQuery.filter());
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

  protected async previewInvoicePdf(item: SaleInvoice): Promise<void> {
    if (!item.id || this.previewingInvoiceId() === item.id) return;

    this.previewingInvoiceId.set(item.id);
    try {
      await this.printService.previewInvoicePdf(item);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to prepare invoice PDF.'));
    } finally {
      this.previewingInvoiceId.set(null);
    }
  }
}
