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
import { CanDirective } from '../../../../../../core/permissions/can.directive';
import { PERMISSION } from '../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../core/permissions/permissions.store';
import {
  CrudFilterPopoverComponent,
  CrudListQueryService,
  CrudPaginatorComponent,
  createCrudUnfilteredTotalCounter,
} from '../../../../../../shared/crud';
import type { CrudFilterField, Lb4ListQuery } from '../../../../../../shared/crud';
import { BulkUploadButtonComponent } from '../../../../../../shared/bulk-upload';
import type { BulkUploadPreviewConfig } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { EmptyStateComponent } from '../../../../../../shared/empty-state';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { JournalService, JournalSourceType } from '../../../../accounting/data/journal';
import {
  JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS,
  JOURNAL_LINK_STATUS_FILTER_FIELD,
} from '../../../../accounting/shared/journal-link-status-filter';
import { ReconciliationMatchService } from '../../../../accounting/data/reconciliation-match';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { BankCashStore } from '../../../data/bank-cash';
import type { BankCash } from '../../../data/bank-cash';
import { VendorStore } from '../../../data/vendor';
import type { Vendor } from '../../../data/vendor';
import { VendorPaymentService, VendorPaymentStore } from '../../../data/vendor-payment';
import type { VendorPayment, VendorPaymentJournal } from '../../../data/vendor-payment';
import { VENDOR_PAYMENT_BULK_UPLOAD_CONFIG } from './vendor-payment-bulk-upload.config';
import { VendorPaymentBulkUploadValidationService } from './vendor-payment-bulk-upload-validation.service';

const DEFAULT_VENDOR_PAYMENT_ORDER = ['date ASC'] as const;

import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
@Component({
  selector: 'app-list-vendor-payment',
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
    TngProgressSpinnerComponent,
    TngTable,
    TngTableCellTpl,
    TableRowIconButtonComponent,
    BulkUploadButtonComponent,
  ],
  templateUrl: './list-vendor-payment.component.html',
  styleUrl: './list-vendor-payment.component.css',
  providers: [CrudListQueryService],
})
export class ListVendorPaymentComponent {
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionsStore);
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly vendorPaymentService = inject(VendorPaymentService);
  private readonly toastStore = inject(ToastStore);
  private readonly bulkUploadValidationService = inject(VendorPaymentBulkUploadValidationService);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  protected readonly bulkUploadConfig: BulkUploadPreviewConfig = {
    ...VENDOR_PAYMENT_BULK_UPLOAD_CONFIG,
    validatePayloadAsync: (payload) => this.bulkUploadValidationService.validateReferences(payload),
  };
  protected readonly hasError = computed(() => this.vendorPaymentStore.error() !== null);
  protected readonly filterClearQueryParams = JOURNAL_LINK_STATUS_FILTER_CLEAR_QUERY_PARAMS;
  private readonly unfilteredTotalCounter = createCrudUnfilteredTotalCounter((query) =>
    this.vendorPaymentService.count(query),
  );
  protected readonly unfilteredTotalItems = this.unfilteredTotalCounter.totalItems;
  protected readonly pageTitle = computed(() => 'Vendor Payments');
  protected readonly pageDescription = computed(() => 'Manage payments made to vendors.');
  protected readonly generatingJournalPaymentId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByPaymentId = signal<Map<string, readonly VendorPaymentJournal[]>>(
    new Map(),
  );
  protected readonly vendorOptionValue = (option: unknown): string => (option as Vendor).id ?? '';
  protected readonly vendorOptionLabel = (option: unknown): string => (option as Vendor).name ?? '';
  protected readonly vendorTrackBy = (_index: number, option: unknown): unknown => {
    const vendor = option as Vendor;

    return vendor.id ?? vendor.name;
  };
  protected readonly bankCashOptionValue = (option: unknown): string =>
    (option as BankCash).id ?? '';
  protected readonly bankCashOptionLabel = (option: unknown): string =>
    (option as BankCash).name ?? '';
  protected readonly bankCashTrackBy = (_index: number, option: unknown): unknown => {
    const bankCash = option as BankCash;

    return bankCash.id ?? bankCash.name;
  };

  protected readonly columns: readonly TngTableColumn<VendorPayment>[] = [
    { id: 'number', label: 'Number', sortable: true, width: '12rem' },
    { id: 'date', label: 'Date', sortable: true, width: '10rem' },
    { id: 'vendor', label: 'Vendor', width: '14rem' },
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
    { id: 'number', label: 'Number', placeholder: 'Search payment number', type: 'text' },
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
    JOURNAL_LINK_STATUS_FILTER_FIELD,
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  constructor() {
    if (this.permissions.can(PERMISSION.branch.vendor.view)) {
      void this.vendorStore.loadVendors({});
    }
    if (this.permissions.can(PERMISSION.branch.bankCash.view)) {
      void this.bankCashStore.loadBankCashes({});
    }
    this.crudQuery.init((filter) => this.loadVendorPaymentsWithJournals(filter));
  }

  private async loadVendorPaymentsWithJournals(filter: Lb4ListQuery): Promise<void> {
    void this.unfilteredTotalCounter.refresh(filter);

    await this.vendorPaymentStore.loadVendorPayments({
      ...filter,
      order: filter.order?.length ? filter.order : DEFAULT_VENDOR_PAYMENT_ORDER,
      includes: ['vendor', 'bcash'],
    });
    if (this.vendorPaymentStore.error()) {
      this.journalsByPaymentId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    await this.loadLinkedJournals(this.vendorPaymentStore.items());
  }

  private async loadLinkedJournals(payments: readonly VendorPayment[]): Promise<void> {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.view)) {
      this.journalsByPaymentId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }
    const ids = payments.map((payment) => payment.id).filter((id): id is string => Boolean(id));
    if (!ids.length) {
      this.journalsByPaymentId.set(new Map());
      this.journalsLoading.set(false);
      return;
    }

    this.journalsLoading.set(true);
    try {
      const groups = await this.reconciliationMatchService.findJournalsBySourceIds(
        JournalSourceType.PAYMENT,
        ids,
      );
      const map = new Map<string, readonly VendorPaymentJournal[]>();
      for (const group of groups) {
        map.set(group.sourceid, group.journals);
      }
      this.journalsByPaymentId.set(map);
    } catch {
      this.journalsByPaymentId.set(new Map());
    } finally {
      this.journalsLoading.set(false);
    }
  }

  protected linkedJournals(row: VendorPayment): readonly VendorPaymentJournal[] {
    const id = row.id;
    if (!id) return [];
    return this.journalsByPaymentId().get(id) ?? [];
  }

  protected hasJournals(row: VendorPayment): boolean {
    return this.linkedJournals(row).length > 0;
  }

  protected viewJournal(journal: VendorPaymentJournal): void {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.view)) return;
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async generateJournal(row: VendorPayment): Promise<void> {
    if (!this.permissions.can(PERMISSION.fiscalYear.journal.create)) return;
    if (!row.id || this.generatingJournalPaymentId() === row.id) return;

    this.generatingJournalPaymentId.set(row.id);
    try {
      const journal = await this.journalService.createFromVendorPayment(row.id);
      this.toastStore.success('Journal generated.');
      const ref: VendorPaymentJournal = { id: journal.id, number: journal.number };
      const map = new Map(this.journalsByPaymentId());
      map.set(row.id, [ref]);
      this.journalsByPaymentId.set(map);
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Failed to generate journal.'));
    } finally {
      this.generatingJournalPaymentId.set(null);
    }
  }

  private searchVendors(query: string): void {
    if (!this.permissions.can(PERMISSION.branch.vendor.view)) return;
    const q = query.trim();

    void this.vendorStore.loadVendors(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  private searchBankCash(query: string): void {
    if (!this.permissions.can(PERMISSION.branch.bankCash.view)) return;
    const q = query.trim();

    void this.bankCashStore.loadBankCashes(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected createPayment(): void {
    void this.router.navigate(['/app/trading/vendor-payment/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected reloadVendorPayments(): void {
    void this.loadVendorPaymentsWithJournals(this.crudQuery.filter());
  }

  protected editPayment(item: VendorPayment): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor-payment', item.id, 'edit'], {
        queryParams: { burl: this.router.url },
      });
    }
  }

  protected viewPayment(item: VendorPayment): void {
    if (!item.id) return;
    void this.router.navigate(['/app/trading/vendor-payment', item.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected deletePayment(item: VendorPayment): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor-payment', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
