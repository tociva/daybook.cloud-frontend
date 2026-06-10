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
import { VendorPaymentStore } from '../../../data/vendor-payment';
import type { VendorPayment, VendorPaymentJournal } from '../../../data/vendor-payment';

@Component({
  selector: 'app-list-vendor-payment',
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
  templateUrl: './list-vendor-payment.component.html',
  styleUrl: './list-vendor-payment.component.css',
  providers: [CrudListQueryService],
})
export class ListVendorPaymentComponent {
  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly journalService = inject(JournalService);
  private readonly reconciliationMatchService = inject(ReconciliationMatchService);
  private readonly toastStore = inject(ToastStore);
  protected readonly crudQuery = inject(CrudListQueryService);
  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  protected readonly hasError = computed(() => this.vendorPaymentStore.error() !== null);
  protected readonly generatingJournalPaymentId = signal<string | null>(null);
  protected readonly journalsLoading = signal(false);
  protected readonly journalsByPaymentId = signal<Map<string, readonly VendorPaymentJournal[]>>(
    new Map(),
  );

  protected readonly columns: readonly TngTableColumn<VendorPayment>[] = [
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
    { id: 'description', label: 'Description', placeholder: 'Search description', type: 'text' },
  ];

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  constructor() {
    this.crudQuery.init((filter) => this.loadVendorPaymentsWithJournals(filter));
  }

  private async loadVendorPaymentsWithJournals(filter: Lb4ListQuery): Promise<void> {
    await this.vendorPaymentStore.loadVendorPayments({
      ...filter,
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
    void this.router.navigate(['/app/accounting/journal', journal.id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async generateJournal(row: VendorPayment): Promise<void> {
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

  protected deletePayment(item: VendorPayment): void {
    if (item.id) {
      void this.router.navigate(['/app/trading/vendor-payment', item.id, 'delete'], {
        queryParams: { burl: this.router.url },
      });
    }
  }
}
