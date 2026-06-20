import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
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
import { VendorStore } from '../../../data/vendor';
import type { Vendor } from '../../../data/vendor';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import {
  JOURNAL_LINK_WORK_ITEM_CLEAR_QUERY_PARAMS,
  isJournalLinkWorkItemMode as hasJournalLinkWorkItemMode,
} from '../../../../accounting/data/journal-link-work-item';
import type { JournalLinkWorkItemSourceType } from '../../../../accounting/data/journal-link-work-item';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { JournalLinkWorkItemListComponent } from '../../../../accounting/shared/journal-link-work-items';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type { PurchaseInvoice, PurchaseInvoiceJournal } from '../../../data/purchase-invoice';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PURCHASE_INVOICE_BULK_UPLOAD_CONFIG } from './purchase-invoice-bulk-upload.config';
import { PurchaseInvoiceBulkUploadValidationService } from './purchase-invoice-bulk-upload-validation.service';
import { validatePurchaseInvoiceBulkUploadPayload } from './purchase-invoice-bulk-upload.validator';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import {
  isPurchaseInvoiceOverdue,
  isPurchaseInvoicePaid,
  totalPurchaseInvoicePaid,
} from './list-purchase-invoice-status.util';

const DEFAULT_PURCHASE_INVOICE_ORDER = ['date ASC'] as const;

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
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
    JournalLinkWorkItemListComponent,
  ],
  templateUrl: './list-purchase-invoice.component.html',
  styleUrl: './list-purchase-invoice.component.css',
  providers: [CrudListQueryService],
})
export class ListPurchaseInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly toastStore = inject(ToastStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly bulkUploadValidationService = inject(PurchaseInvoiceBulkUploadValidationService);
  protected readonly bulkUploadConfig = computed<BulkUploadPreviewConfig>(() => ({
    ...PURCHASE_INVOICE_BULK_UPLOAD_CONFIG,
    prepareValidation: () => this.bulkUploadValidationService.prepare(),
    validatePayload: (payload) =>
      validatePurchaseInvoiceBulkUploadPayload(payload, {
        minorUnit: this.bulkUploadValidationService.branchMinorUnit(),
      }),
    validatePayloadAsync: (payload) => this.bulkUploadValidationService.validateReferences(payload),
  }));
  protected readonly hasError = computed(() => this.purchaseInvoiceStore.error() !== null);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  protected readonly journalLinkWorkItemSourceType: JournalLinkWorkItemSourceType =
    'purchase_invoice';
  protected readonly journalLinkWorkItemClearQueryParams =
    JOURNAL_LINK_WORK_ITEM_CLEAR_QUERY_PARAMS;
  protected readonly isJournalLinkWorkItemMode = computed(() =>
    hasJournalLinkWorkItemMode(this.queryParams(), this.journalLinkWorkItemSourceType),
  );
  protected readonly pageTitle = computed(() =>
    this.isJournalLinkWorkItemMode()
      ? 'Purchase invoices pending journal links'
      : 'Purchase Invoices',
  );
  protected readonly pageDescription = computed(() =>
    this.isJournalLinkWorkItemMode()
      ? 'Review purchase invoices that are not fully linked to journals.'
      : 'Manage your purchase invoices and vendor billing records.',
  );
  protected readonly generatingJournalInvoiceId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByInvoiceId = signal<Map<string, readonly PurchaseInvoiceJournal[]>>(
    new Map(),
  );

  protected readonly vendorOptionValue = (option: unknown): string => (option as Vendor).id ?? '';
  protected readonly vendorOptionLabel = (option: unknown): string => (option as Vendor).name ?? '';
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
    { id: 'payments', label: 'Payments', align: 'end', headerAlign: 'end', width: '10rem' },
    { id: 'journals', label: 'Journals', width: '12rem' },
    { id: 'actions', label: 'Actions', align: 'end', headerAlign: 'end', width: '12rem' },
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
    return totalPurchaseInvoicePaid(row);
  }

  protected isPaid(row: PurchaseInvoice): boolean {
    return isPurchaseInvoicePaid(row);
  }

  protected isOverdue(row: PurchaseInvoice): boolean {
    return isPurchaseInvoiceOverdue(row);
  }

  constructor() {
    void this.vendorStore.loadVendors({});
    this.crudQuery.init((filter) => this.loadPurchaseInvoicesWithJournals(filter));
  }

  private async loadPurchaseInvoicesWithJournals(filter: Lb4ListQuery): Promise<void> {
    if (this.isJournalLinkWorkItemMode()) {
      this.journalsByInvoiceId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    await this.purchaseInvoiceStore.loadPurchaseInvoices({
      ...filter,
      order: filter.order?.length ? filter.order : DEFAULT_PURCHASE_INVOICE_ORDER,
      includes: ['vendor', 'payments', 'currency'],
    });
    if (this.purchaseInvoiceStore.error()) {
      this.journalsByInvoiceId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.purchaseInvoiceStore.items());
  }

  private async loadLinkedJournals(invoices: readonly PurchaseInvoice[]): Promise<void> {
    const ids = invoices.map((invoice) => invoice.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByInvoiceId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.PURCHASE_INVOICE,
        ids,
      );
      const map = new Map<string, readonly PurchaseInvoiceJournal[]>();
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

  protected linkedJournals(row: PurchaseInvoice): readonly PurchaseInvoiceJournal[] {
    const id = row.id;
    if (!id) return [];
    return this.journalsByInvoiceId().get(id) ?? [];
  }

  protected hasJournals(row: PurchaseInvoice): boolean {
    return this.linkedJournals(row).length > 0;
  }

  protected viewJournal(journal: PurchaseInvoiceJournal): void {
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async generateJournal(row: PurchaseInvoice): Promise<void> {
    if (!row.id || this.generatingJournalInvoiceId() === row.id) return;

    this.generatingJournalInvoiceId.set(row.id);
    try {
      const journal = await this.journalService.createFromPurchaseInvoice(row.id);
      this.toastStore.success('Journal generated.');
      const ref: PurchaseInvoiceJournal = { id: journal.id, number: journal.number };
      const map = new Map(this.journalsByInvoiceId());
      map.set(row.id, [ref]);
      this.journalsByInvoiceId.set(map);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to generate journal.'));
    } finally {
      this.generatingJournalInvoiceId.set(null);
    }
  }

  private searchVendors(query: string): void {
    const q = query.trim();
    void this.vendorStore.loadVendors(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  /** Navigate to new vendor payment pre-linked to this invoice. */
  protected createPaymentForInvoice(item: PurchaseInvoice): void {
    this.purchaseInvoiceStore.setSelectedItem(item);
    void this.router.navigate(['/app/trading/vendor-payment/create'], {
      queryParams: { purchaseinvoiceid: item.id, burl: this.router.url },
    });
  }

  /** Navigate to all vendor payments linked to this invoice. */
  protected viewPaymentsForInvoice(item: PurchaseInvoice): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/purchase-invoice', item.id, 'payments'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected createPurchaseInvoice(): void {
    void this.router.navigate(['/app/trading/purchase-invoice/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadPurchaseInvoices(): void {
    void this.loadPurchaseInvoicesWithJournals(this.crudQuery.filter());
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
