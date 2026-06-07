import { Component, computed, effect, inject, signal } from '@angular/core';
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
import { CustomerStore } from '../../../../trading/data/customer';
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

const GST_AMOUNT_TOLERANCE = 0;

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
  private readonly customerStore = inject(CustomerStore);
  private readonly vendorStore = inject(VendorStore);
  protected readonly store = inject(GstReconciliationStore);
  private readonly customersLoaded = signal(false);
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
    effect(() => {
      const session = this.sessionStore.session();
      if (!session?.branch?.id) return;
      void this.loadData();
    });
  }

  protected async back(): Promise<void> {
    const backUrl = this.route.snapshot.queryParamMap.get('burl');
    await this.router.navigateByUrl(backUrl || '/app/trading/gst-reconciliation');
  }

  protected status(row: GstReconciliationDetailRow): DisplayStatus {
    if (row.booksInvoice && row.gstInvoice) {
      return this.rowDifferenceAmount(row) <= GST_AMOUNT_TOLERANCE ? 'matched' : 'partial';
    }

    if (row.booksInvoice || row.gstInvoice) {
      return 'notMatched';
    }

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
    return formatAmountWithCurrency(value ?? 0, this.branchCurrencyCode());
  }

  protected invoiceNumber(invoice: GstReconciliationInvoice | null | undefined): string {
    return invoice?.invoiceNumber?.trim() || '-';
  }

  protected invoiceTotal(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatInvoiceAmount(invoice, invoice.invoiceValue);
  }

  protected invoiceTax(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatInvoiceAmount(invoice, invoice.totalTax);
  }

  protected invoiceTaxable(invoice: GstReconciliationInvoice | null | undefined): string {
    if (!invoice) return '-';
    return this.formatInvoiceAmount(invoice, invoice.taxableValue);
  }

  protected showBookInvoiceConvertedAmount(
    invoice: GstReconciliationInvoice | null | undefined,
  ): boolean {
    if (!invoice) return false;

    const invoiceCurrency = this.invoiceCurrencyCode(invoice);
    const branchCurrency = this.branchCurrencyCode();

    return !!invoiceCurrency && !!branchCurrency && invoiceCurrency !== branchCurrency;
  }

  protected bookInvoiceConvertedTotal(
    invoice: GstReconciliationInvoice | null | undefined,
  ): string {
    if (!invoice) return '-';

    return this.formatAmount(this.convertedInvoiceValue(invoice, 'invoiceValue'));
  }

  protected detailMatchedCount(detail: GstReconciliationDetailResponse): number {
    return this.detailRows(detail).filter((row) => this.status(row) === 'matched').length;
  }

  protected detailPartialCount(detail: GstReconciliationDetailResponse): number {
    return this.detailRows(detail).filter((row) => {
      const status = this.status(row);
      return status === 'partial' || status === 'partialMatch';
    }).length;
  }

  protected detailNotMatchedCount(detail: GstReconciliationDetailResponse): number {
    return this.detailRows(detail).filter((row) => {
      const status = this.status(row);
      return status === 'notMatched' || status === 'noMatch';
    }).length;
  }

  protected hasDifference(row: GstReconciliationDetailRow): boolean {
    return this.rowDifferenceAmount(row) > GST_AMOUNT_TOLERANCE;
  }

  protected rowParty(row: GstReconciliationDetailRow): string {
    return row.partyName || row.partyGstin || '-';
  }

  protected partyName(group: GstReconciliationPartyGroup): string {
    return group.partyName || this.localPartyName(group.partyGstin) || 'Unknown Party';
  }

  protected rowDifferenceAmount(row: GstReconciliationDetailRow): number {
    if (!row.booksInvoice || !row.gstInvoice) {
      return row.differenceAmount ?? 0;
    }

    return this.roundAmount(Math.abs(
      this.bookInvoiceReconciliationValue(row.booksInvoice) -
        (row.gstInvoice.invoiceValue ?? 0),
    ));
  }

  protected rowReason(row: GstReconciliationDetailRow): string {
    if (row.booksInvoice && row.gstInvoice && !this.hasDifference(row)) {
      return '';
    }

    return row.reason || '';
  }

  protected detailDifferenceAmount(detail: GstReconciliationDetailResponse): number {
    return detail.groups.reduce(
      (total, group) =>
        total + group.rows.reduce((groupTotal, row) => groupTotal + this.rowDifferenceAmount(row), 0),
      0,
    );
  }

  protected groupedPartyGroups(
    groups: readonly GstReconciliationPartyGroup[],
  ): readonly GstReconciliationPartyGroup[] {
    const grouped = new Map<string, GstReconciliationPartyGroup>();

    groups.forEach((group, index) => {
      const key = this.partyGroupKey(group, index);
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, group);
        return;
      }

      grouped.set(key, {
        partyGstin: existing.partyGstin || group.partyGstin,
        partyName: existing.partyName || group.partyName,
        rows: [...existing.rows, ...group.rows],
      });
    });

    return [...grouped.values()];
  }

  protected showCreatePartyLink(group: GstReconciliationPartyGroup): boolean {
    if (!group.partyName && !group.partyGstin) {
      return false;
    }

    return this.returnType() === 'gstr2b'
      ? this.vendorsLoaded() && !this.hasLocalVendor(group)
      : this.customersLoaded() && !this.hasLocalCustomer(group);
  }

  protected createPartyLabel(): string {
    return this.returnType() === 'gstr2b' ? 'Create new vendor' : 'Create new customer';
  }

  protected missingPartyMessage(): string {
    return this.returnType() === 'gstr2b'
      ? 'Vendor not exists in our record,'
      : 'Customer not exists in our record,';
  }

  protected async createParty(group: GstReconciliationPartyGroup): Promise<void> {
    const route =
      this.returnType() === 'gstr2b'
        ? '/app/trading/vendor/create'
        : '/app/trading/customer/create';

    if (this.returnType() === 'gstr2b') {
      this.vendorStore.clearSelectedItem();
    } else {
      this.customerStore.clearSelectedItem();
    }

    await this.router.navigate([route], {
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
    const partyName = row.partyName || this.localPartyName(row.partyGstin || group.partyGstin) || group.partyName;
    const partyGstin = row.partyGstin || group.partyGstin;
    const route =
      this.returnType() === 'gstr2b'
        ? '/app/trading/purchase-invoice/create'
        : '/app/trading/sale-invoice/create';

    await this.router.navigate([route], {
      queryParams: {
        burl: this.router.url,
        ...(partyName ? { partyName } : {}),
        ...(partyGstin ? { partyGstin } : {}),
        ...(sourceInvoice?.invoiceNumber ? { invoiceNumber: sourceInvoice.invoiceNumber } : {}),
        ...(sourceInvoice?.invoiceDate ? { invoiceDate: sourceInvoice.invoiceDate } : {}),
        ...(this.isExportInvoice(row, group) ? { invoiceType: 'Export' } : {}),
        ...(sourceInvoice?.taxableValue !== undefined ? { taxableValue: sourceInvoice.taxableValue } : {}),
        ...(sourceInvoice?.totalTax !== undefined ? { totalTax: sourceInvoice.totalTax } : {}),
        ...(sourceInvoice?.invoiceValue !== undefined ? { invoiceValue: sourceInvoice.invoiceValue } : {}),
        ...(sourceInvoice?.igst !== undefined ? { igst: sourceInvoice.igst } : {}),
        ...(sourceInvoice?.cgst !== undefined ? { cgst: sourceInvoice.cgst } : {}),
        ...(sourceInvoice?.sgst !== undefined ? { sgst: sourceInvoice.sgst } : {}),
      },
    });
  }

  private async loadData(): Promise<void> {
    await this.loadDetail();
    await this.loadLocalParties();
  }

  private async loadDetail(): Promise<void> {
    const session = this.sessionStore.session();
    if (!session?.branch?.id) return;
    await this.store.loadDetail(this.returnType(), this.month());
  }

  private async loadLocalParties(): Promise<void> {
    const gstins = this.detailPartyGstins();

    if (gstins.length === 0) {
      this.vendorsLoaded.set(this.returnType() === 'gstr2b');
      this.customersLoaded.set(this.returnType() === 'gstr1');
      return;
    }

    const query = {
      limit: gstins.length,
      offset: 0,
      where:
        gstins.length === 1
          ? { gstin: { ilike: gstins[0] } }
          : { or: gstins.map((gstin) => ({ gstin: { ilike: gstin } })) },
    };

    if (this.returnType() === 'gstr2b') {
      this.vendorStore.clearError();
      await this.vendorStore.loadVendors(query);
      this.vendorsLoaded.set(this.vendorStore.error() === null);
      return;
    }

    this.customerStore.clearError();
    await this.customerStore.loadCustomers(query);
    this.customersLoaded.set(this.customerStore.error() === null);
  }

  private hasLocalVendor(group: GstReconciliationPartyGroup): boolean {
    const partyGstin = this.normalizeComparable(group.partyGstin);
    if (!partyGstin) return false;

    return this.vendorStore.items().some((vendor) => {
      const vendorGstin = this.normalizeComparable(vendor.gstin);

      return vendorGstin === partyGstin;
    });
  }

  private hasLocalCustomer(group: GstReconciliationPartyGroup): boolean {
    const partyGstin = this.normalizeComparable(group.partyGstin);
    if (!partyGstin) return false;

    return this.customerStore.items().some((customer) => {
      const customerGstin = this.normalizeComparable(customer.gstin);

      return customerGstin === partyGstin;
    });
  }

  private localPartyName(gstin: string | null | undefined): string {
    const partyGstin = this.normalizeComparable(gstin);
    if (!partyGstin) return '';

    const localParty =
      this.returnType() === 'gstr2b'
        ? this.vendorStore
            .items()
            .find((vendor) => this.normalizeComparable(vendor.gstin) === partyGstin)
        : this.customerStore
            .items()
            .find((customer) => this.normalizeComparable(customer.gstin) === partyGstin);

    return localParty?.name?.trim() ?? '';
  }

  private detailPartyGstins(): string[] {
    const gstins = new Set<string>();

    this.store.detail()?.groups.forEach((group) => {
      this.addGstin(gstins, group.partyGstin);
      group.rows.forEach((row) => this.addGstin(gstins, row.partyGstin));
    });

    return [...gstins];
  }

  private addGstin(gstins: Set<string>, value: string | null | undefined): void {
    const gstin = value?.trim();
    if (gstin) gstins.add(gstin);
  }

  private normalizeComparable(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private partyGroupKey(group: GstReconciliationPartyGroup, index: number): string {
    const gstin = this.normalizeComparable(group.partyGstin);
    if (gstin) return `gstin:${gstin}`;

    const name = this.normalizeComparable(group.partyName);
    if (name) return `name:${name}`;

    return `unknown:${index}`;
  }

  private returnTypeLabel(returnType: GstReconciliationReturnType): string {
    return returnType === 'gstr1' ? 'GSTR-1' : 'GSTR-2B';
  }

  private isExportInvoice(
    row: GstReconciliationDetailRow,
    group: GstReconciliationPartyGroup,
  ): boolean {
    if (this.returnType() !== 'gstr1') return false;

    const invoice = row.gstInvoice;
    const invoiceType = this.normalizeComparable(
      invoice?.exportType ??
        invoice?.invoiceType ??
        invoice?.gstInvoiceType ??
        invoice?.supplyType ??
        invoice?.type,
    );

    if (
      invoiceType.includes('export') ||
      invoiceType === 'exp' ||
      invoiceType === 'wpay' ||
      invoiceType === 'wopay'
    ) {
      return true;
    }

    const partyGstin = this.normalizeComparable(row.partyGstin || group.partyGstin);
    const totalTax = (invoice?.igst ?? 0) + (invoice?.cgst ?? 0) + (invoice?.sgst ?? 0);

    return !partyGstin && !!invoice && totalTax === 0;
  }

  private formatInvoiceAmount(
    invoice: GstReconciliationInvoice,
    value: number | null | undefined,
  ): string {
    return formatAmountWithCurrency(value ?? 0, this.invoiceCurrencyCode(invoice));
  }

  private detailRows(detail: GstReconciliationDetailResponse): readonly GstReconciliationDetailRow[] {
    return detail.groups.flatMap((group) => group.rows);
  }

  private bookInvoiceReconciliationValue(
    invoice: GstReconciliationInvoice | null | undefined,
  ): number {
    if (!invoice) return 0;
    return this.convertedInvoiceValue(invoice, 'invoiceValue');
  }

  private convertedInvoiceValue(
    invoice: GstReconciliationInvoice,
    amountKey: 'taxableValue' | 'totalTax' | 'invoiceValue',
  ): number {
    const value = invoice[amountKey] ?? 0;

    if (!this.showBookInvoiceConvertedAmount(invoice)) {
      return value;
    }

    const explicitConvertedValue = this.explicitConvertedInvoiceValue(invoice, amountKey);
    if (explicitConvertedValue !== null) return explicitConvertedValue;

    return value * this.invoiceConversionRate(invoice);
  }

  private explicitConvertedInvoiceValue(
    invoice: GstReconciliationInvoice,
    amountKey: 'taxableValue' | 'totalTax' | 'invoiceValue',
  ): number | null {
    if (amountKey === 'invoiceValue') {
      const localAmount = this.numericValue(invoice.cprops?.lamt);
      if (localAmount !== null) return localAmount;
    }

    const convertedKeys: Record<typeof amountKey, readonly string[]> = {
      taxableValue: ['convertedTaxableValue', 'taxableValueInBranchCurrency'],
      totalTax: ['convertedTotalTax', 'totalTaxInBranchCurrency'],
      invoiceValue: ['convertedInvoiceValue', 'invoiceValueInBranchCurrency'],
    };

    for (const key of convertedKeys[amountKey]) {
      const value = this.numericValue(invoice[key]);
      if (value !== null) return value;
    }

    return null;
  }

  private invoiceConversionRate(invoice: GstReconciliationInvoice): number {
    const rate =
      this.numericValue(invoice.conversionrate) ??
      this.numericValue(invoice.exchangeRate) ??
      this.numericValue(invoice.cprops?.fx);

    return rate && rate > 0 ? rate : 1;
  }

  private invoiceCurrencyCode(invoice: GstReconciliationInvoice): string | undefined {
    return (
      invoice.currencycode?.trim() ||
      invoice.currency?.code?.trim() ||
      this.branchCurrencyCode()
    );
  }

  private numericValue(value: unknown): number | null {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private roundAmount(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private branchCurrencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.branch?.currencycode ??
      this.sessionStore.session()?.fiscalyear?.currencycode
    );
  }
}
