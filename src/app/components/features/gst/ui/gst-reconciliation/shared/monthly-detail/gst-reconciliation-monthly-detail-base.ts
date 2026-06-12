import { computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import type { TngTableColumn } from '@tailng-ui/components';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../../shared/format/currency';
import type { Lb4ListQuery } from '../../../../../../../shared/crud';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import { CustomerStore, type Customer } from '../../../../../trading/data/customer';
import { CustomerService } from '../../../../../trading/data/customer/customer.service';
import { VendorStore, type Vendor } from '../../../../../trading/data/vendor';
import { VendorService } from '../../../../../trading/data/vendor/vendor.service';
import {
  GstReconciliationStore,
  type GstComputedStatus,
  type GstReconciliationDetailRow,
  type GstReconciliationInvoice,
  type GstReconciliationPartyGroup,
  type GstReconciliationStatus,
} from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import type { GstReconciliationMonthlyDetailConfig } from './gst-reconciliation-monthly-detail.config';

type DisplayStatus = GstReconciliationStatus | GstComputedStatus;

type StatusMeta = Readonly<{
  icon: string;
  label: string;
  status: DisplayStatus;
}>;

type LocalParty = Customer | Vendor;

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

export abstract class GstReconciliationMonthlyDetailBase {
  protected readonly dateManagement = inject(DateManagementService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly sessionStore = inject(UserSessionStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly customerService = inject(CustomerService);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly vendorService = inject(VendorService);
  protected readonly store = inject(GstReconciliationStore);

  private readonly localPartiesByGstin = signal<ReadonlyMap<string, LocalParty>>(new Map());
  private readonly partiesLoaded = signal(false);

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

  protected get reconciliationColumns(): readonly TngTableColumn<GstReconciliationDetailRow>[] {
    return [
      { id: 'status', label: 'Status', width: '9rem' },
      { id: 'booksInvoice', label: 'Books Invoice', width: '17rem' },
      { id: 'gstInvoice', label: 'GST Portal Invoice', width: '17rem' },
      { id: 'difference', label: 'Difference', align: 'end', headerAlign: 'end', width: '9rem' },
      { id: 'reason', label: this.config.detailsColumnLabel, width: '16rem' },
    ];
  }

  protected readonly month = computed(() => Number(this.route.snapshot.paramMap.get('month') ?? 4));

  protected readonly title = computed(
    () => `${this.config.returnTypeLabel} · ${MONTH_NAMES[this.month()] ?? 'Month'}`,
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

  protected constructor(protected readonly config: GstReconciliationMonthlyDetailConfig) {
    effect(() => {
      const session = this.sessionStore.session();
      if (!session?.branch?.id) return;
      void this.loadData();
    });
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

  protected bookInvoiceItemNames(row: GstReconciliationDetailRow): readonly string[] {
    if (!this.config.includeBookInvoiceItemNames) return [];

    const items = row.booksInvoice?.items;
    if (!items?.length) return [];

    return items
      .map((lineItem) => this.bookInvoiceLineItemName(lineItem))
      .filter((name): name is string => !!name);
  }

  protected hasRowDetails(row: GstReconciliationDetailRow): boolean {
    return !!this.rowReason(row) || this.bookInvoiceItemNames(row).length > 0;
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

    return this.partiesLoaded() && !this.hasLocalParty(group);
  }

  protected createPartyLabel(): string {
    return this.config.createPartyLabel;
  }

  protected missingPartyMessage(): string {
    return this.config.missingPartyMessage;
  }

  protected async createParty(group: GstReconciliationPartyGroup): Promise<void> {
    if (this.config.partyType === 'vendor') {
      this.vendorStore.clearSelectedItem();
    } else {
      this.customerStore.clearSelectedItem();
    }

    await this.router.navigate([this.config.createPartyRoute], {
      queryParams: {
        burl: this.router.url,
        ...(group.partyName ? { name: group.partyName } : {}),
        ...(group.partyGstin ? { gstin: group.partyGstin } : {}),
      },
    });
  }

  protected createBookInvoiceLabel(): string {
    return this.config.createBookInvoiceLabel;
  }

  protected canViewBookInvoice(invoice: GstReconciliationInvoice | null | undefined): boolean {
    return !!invoice?.id?.trim();
  }

  protected async viewBookInvoice(invoice: GstReconciliationInvoice): Promise<void> {
    const id = invoice.id?.trim();
    if (!id) return;

    await this.router.navigate([this.config.bookInvoiceViewRoutePrefix, id], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async createBookInvoice(
    row: GstReconciliationDetailRow,
    group: GstReconciliationPartyGroup,
  ): Promise<void> {
    const sourceInvoice = row.gstInvoice;
    const partyName = row.partyName || this.localPartyName(row.partyGstin || group.partyGstin) || group.partyName;
    const partyGstin = row.partyGstin || group.partyGstin;

    await this.router.navigate([this.config.createBookInvoiceRoute], {
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
    await this.store.loadDetail(this.config.returnType, this.month());
  }

  private async loadLocalParties(): Promise<void> {
    const gstins = this.detailPartyGstins();
    this.localPartiesByGstin.set(new Map());
    this.partiesLoaded.set(false);

    if (gstins.length === 0) {
      this.partiesLoaded.set(true);
      return;
    }

    const query: Lb4ListQuery = {
      limit: gstins.length,
      offset: 0,
      where:
        gstins.length === 1
          ? { gstin: { ilike: gstins[0] } }
          : { or: gstins.map((gstin) => ({ gstin: { ilike: gstin } })) },
    };

    try {
      const parties =
        this.config.partyType === 'vendor'
          ? await this.vendorService.list(query)
          : await this.customerService.list(query);
      this.localPartiesByGstin.set(this.mapLocalPartiesByGstin(parties));
      this.partiesLoaded.set(true);
    } catch {
      this.localPartiesByGstin.set(new Map());
      this.partiesLoaded.set(false);
    }
  }

  private hasLocalParty(group: GstReconciliationPartyGroup): boolean {
    const partyGstin = this.normalizeComparable(group.partyGstin);
    if (!partyGstin) return false;

    return this.localPartiesByGstin().has(partyGstin);
  }

  private localPartyName(gstin: string | null | undefined): string {
    const partyGstin = this.normalizeComparable(gstin);
    if (!partyGstin) return '';

    const localParty = this.localPartiesByGstin().get(partyGstin);

    return localParty?.name?.trim() ?? '';
  }

  private mapLocalPartiesByGstin(parties: readonly LocalParty[]): ReadonlyMap<string, LocalParty> {
    const partiesByGstin = new Map<string, LocalParty>();

    parties.forEach((party) => {
      const gstin = this.normalizeComparable(party.gstin);
      if (gstin) partiesByGstin.set(gstin, party);
    });

    return partiesByGstin;
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

  private isExportInvoice(
    row: GstReconciliationDetailRow,
    group: GstReconciliationPartyGroup,
  ): boolean {
    if (!this.config.supportsExportInvoice) return false;

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

  private bookInvoiceLineItemName(
    lineItem: NonNullable<GstReconciliationInvoice['items']>[number],
  ): string {
    return (
      lineItem.displayname?.trim() ||
      lineItem.name?.trim() ||
      lineItem.item?.displayname?.trim() ||
      lineItem.item?.name?.trim() ||
      ''
    );
  }

  private formatInvoiceAmount(
    invoice: GstReconciliationInvoice,
    value: number | null | undefined,
  ): string {
    return formatAmountWithCurrency(value ?? 0, this.invoiceCurrencyCode(invoice));
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
