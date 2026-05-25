import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import { PageHeadingComponent } from '../../../../../../shared/page-heading/page-heading.component';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { VendorStore } from '../../../../trading/data/vendor';
import type { GstReconciliationDetailResponse } from '../../../data/gst-reconciliation/gst-reconciliation.model';
import {
  GstReconciliationStore,
  type GstComputedStatus,
  type GstReconciliationDetailRow,
  type GstReconciliationInvoice,
  type GstReconciliationPartyGroup,
  type GstReconciliationReturnType,
  type GstReconciliationStatus,
} from '../../../data/gst-reconciliation/gst-reconciliation.store';

type DisplayStatus = GstReconciliationStatus | GstComputedStatus;

type StatusMeta = Readonly<{
  icon: string;
  label: string;
  status: DisplayStatus;
}>;

const MONTH_NAMES: Readonly<Record<number, string>> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
};

@Component({
  selector: 'app-gst-reconciliation-monthly-detail',
  standalone: true,
  imports: [
    PageHeadingComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './gst-reconciliation-monthly-detail.component.html',
  styleUrl: './gst-reconciliation-monthly-detail.component.css',
})
export class GstReconciliationMonthlyDetailComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(UserSessionStore);
  private readonly vendorStore = inject(VendorStore);
  protected readonly store = inject(GstReconciliationStore);
  private readonly vendorsLoaded = signal(false);

  protected readonly statusLegend: readonly StatusMeta[] = [
    { status: 'matched', label: 'Matched', icon: 'circleCheck' },
    { status: 'partialMatch', label: 'Partial match', icon: 'circleAlert' },
    { status: 'partial', label: 'Partial', icon: 'circleAlert' },
    { status: 'noMatch', label: 'No match', icon: 'circleX' },
    { status: 'notMatched', label: 'Not matched', icon: 'circleX' },
    { status: 'inProgress', label: 'In progress', icon: 'loaderCircle' },
    { status: 'pending', label: 'Pending', icon: 'circleDashed' },
    { status: 'upcoming', label: 'Upcoming', icon: 'clock' },
  ];

  protected readonly reconciliationColumns: readonly TngTableColumn<GstReconciliationDetailRow>[] = [
    { id: 'status', label: 'Status', width: '9rem' },
    { id: 'party', label: 'Party in Book', width: '13rem' },
    { id: 'booksInvoice', label: 'Books Invoice', width: '17rem' },
    { id: 'gstInvoice', label: 'GST Portal Invoice', width: '17rem' },
    { id: 'difference', label: 'Difference', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'reason', label: 'Reason', width: '16rem' },
  ];

  protected readonly returnType = computed<GstReconciliationReturnType>(() => {
    const value = this.route.snapshot.paramMap.get('returnType');
    return value === 'gstr2b' ? 'gstr2b' : 'gstr1';
  });

  protected readonly month = computed(() => Number(this.route.snapshot.paramMap.get('month') ?? 4));

  protected readonly title = computed(
    () => `${this.returnTypeLabel(this.returnType())} · ${MONTH_NAMES[this.month()] ?? 'Month'}`,
  );

  protected readonly contextMessage = computed(() => {
    const session = this.sessionStore.session();
    const missing: string[] = [];
    if (!session?.branch?.id) missing.push('branch');

    return missing.length ? `Select ${missing.join(', ')} to load GST reconciliation.` : '';
  });

  protected readonly description = computed(() => {
    return this.contextMessage() || 'Monthly reconciliation grouped by party.';
  });

  constructor() {
    void this.loadDetail();
    void this.loadVendors();
  }

  protected async back(): Promise<void> {
    const backUrl = this.route.snapshot.queryParamMap.get('burl');
    await this.router.navigateByUrl(backUrl || '/app/trading/gst-reconciliation');
  }

  protected status(row: GstReconciliationDetailRow): DisplayStatus {
    return row.status ?? row.reconciliationStatus ?? row.computedStatus ?? 'pending';
  }

  protected statusLabel(status: DisplayStatus): string {
    return this.statusLegend.find((entry) => entry.status === status)?.label ?? status;
  }

  protected statusIcon(status: DisplayStatus): string {
    return this.statusLegend.find((entry) => entry.status === status)?.icon ?? 'circle';
  }

  protected formatDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '-');
  }

  protected formatAmount(value: number | null | undefined): string {
    return formatAmountWithCurrency(value ?? 0, this.currencyCode());
  }

  protected invoiceNumber(invoice: GstReconciliationInvoice | null | undefined): string {
    return invoice?.invoiceNumber?.trim() || '-';
  }

  protected invoiceTotal(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.invoiceValue);
  }

  protected invoiceTax(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.totalTax);
  }

  protected invoiceTaxable(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatAmount(invoice.taxableValue);
  }

  protected hasDifference(row: GstReconciliationDetailRow): boolean {
    return this.rowDifferenceAmount(row) !== 0;
  }

  protected rowParty(row: GstReconciliationDetailRow): string {
    return row.partyName || row.partyGstin || '-';
  }

  protected rowDifferenceAmount(row: GstReconciliationDetailRow): number {
    return Math.abs(
      (row.booksInvoice?.invoiceValue ?? 0) - (row.gstInvoice?.invoiceValue ?? 0),
    );
  }

  protected detailDifferenceAmount(detail: GstReconciliationDetailResponse): number {
    return detail.groups.reduce(
      (total, group) =>
        total + group.rows.reduce((groupTotal, row) => groupTotal + this.rowDifferenceAmount(row), 0),
      0,
    );
  }

  protected showCreateVendorLink(group: GstReconciliationPartyGroup): boolean {
    if (
      this.returnType() !== 'gstr2b' ||
      !this.vendorsLoaded() ||
      (!group.partyName && !group.partyGstin)
    ) {
      return false;
    }

    return !this.hasLocalVendor(group);
  }

  protected async createVendor(group: GstReconciliationPartyGroup): Promise<void> {
    this.vendorStore.clearSelectedItem();
    await this.router.navigate(['/app/trading/vendor/create'], {
      queryParams: {
        burl: this.router.url,
        ...(group.partyName ? { name: group.partyName } : {}),
        ...(group.partyGstin ? { gstin: group.partyGstin } : {}),
      },
    });
  }

  protected createBookInvoiceLabel(): string {
    return this.returnType() === 'gstr2b' ? 'Create purchase invoice' : 'Create sale invoice';
  }

  protected async createBookInvoice(
    row: GstReconciliationDetailRow,
    group: GstReconciliationPartyGroup,
  ): Promise<void> {
    const sourceInvoice = row.gstInvoice;
    const route =
      this.returnType() === 'gstr2b'
        ? '/app/trading/purchase-invoice/create'
        : '/app/trading/sale-invoice/create';

    await this.router.navigate([route], {
      queryParams: {
        burl: this.router.url,
        ...(row.partyName || group.partyName ? { partyName: row.partyName || group.partyName } : {}),
        ...(row.partyGstin || group.partyGstin ? { partyGstin: row.partyGstin || group.partyGstin } : {}),
        ...(sourceInvoice?.invoiceNumber ? { invoiceNumber: sourceInvoice.invoiceNumber } : {}),
        ...(sourceInvoice?.invoiceDate ? { invoiceDate: sourceInvoice.invoiceDate } : {}),
      },
    });
  }

  private async loadDetail(): Promise<void> {
    const session = this.sessionStore.session();
    if (!session?.branch?.id) return;
    await this.store.loadDetail(this.returnType(), this.month());
  }

  private async loadVendors(): Promise<void> {
    if (this.returnType() !== 'gstr2b') {
      return;
    }

    this.vendorStore.clearError();
    await this.vendorStore.loadVendors();
    this.vendorsLoaded.set(this.vendorStore.error() === null);
  }

  private hasLocalVendor(group: GstReconciliationPartyGroup): boolean {
    const partyGstin = this.normalizeComparable(group.partyGstin);
    const partyName = this.normalizeComparable(group.partyName);

    return this.vendorStore.items().some((vendor) => {
      const vendorGstin = this.normalizeComparable(vendor.gstin);
      const vendorName = this.normalizeComparable(vendor.name);

      return (
        (partyGstin && vendorGstin === partyGstin) ||
        (!partyGstin && partyName && vendorName === partyName)
      );
    });
  }

  private normalizeComparable(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private returnTypeLabel(returnType: GstReconciliationReturnType): string {
    return returnType === 'gstr1' ? 'GSTR-1' : 'GSTR-2B';
  }

  private currencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.fiscalyear?.currencycode ??
      this.sessionStore.session()?.branch?.currencycode
    );
  }
}
