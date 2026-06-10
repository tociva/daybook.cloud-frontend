import { computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationDetailRow,
  type GstReconciliationInvoice,
  type GstReconciliationMonthSummary,
  type GstReconciliationReturnType,
  type GstReconciliationStatus,
} from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import { GstReconciliationService } from '../../../../data/gst-reconciliation/gst-reconciliation.service';
import type { GstReconciliationMonthCell } from '../../gst-reconciliation.types';
import {
  buildGstReconciliationMonthCells,
  gstReconciliationMonthDifferenceKey,
} from './gst-reconciliation-months.util';

type MonthDisplayOverride = Readonly<{
  differenceAmount: number;
  matchedCount: number;
  mismatchCount: number;
  partialCount: number;
  status: GstReconciliationStatus;
}>;

const GST_AMOUNT_TOLERANCE = 0;

export abstract class GstReconciliationReturnBase {
  protected readonly router = inject(Router);
  protected readonly sessionStore = inject(UserSessionStore);
  protected readonly reconciliationService = inject(GstReconciliationService);
  protected readonly store = inject(GstReconciliationStore);

  protected readonly refreshingCell = signal<string | null>(null);
  protected readonly monthDifferenceAmounts = signal<Readonly<Record<string, number>>>({});
  protected readonly monthDisplayOverrides = signal<Readonly<Record<string, MonthDisplayOverride>>>({});

  private readonly loadedDifferenceKeys = new Set<string>();
  private readonly loadingDifferenceKeys = new Set<string>();

  protected readonly months = computed(() => {
    const overrides = this.monthDisplayOverrides();

    return buildGstReconciliationMonthCells({
      fiscalYearStartYear: this.fiscalYearStartYear(),
      returnType: this.returnType,
      summaries: this.store.summary()?.[this.returnType] ?? [],
    }).map((cell) => ({
      ...cell,
      ...overrides[gstReconciliationMonthDifferenceKey(cell)],
    }));
  });

  protected constructor(protected readonly returnType: GstReconciliationReturnType) {
    effect(() => {
      const summary = this.store.summary();
      if (!summary) return;
      void this.hydrateMonthDifferences(summary[this.returnType]);
    });
  }

  protected openMonth(cell: GstReconciliationMonthCell): void {
    if (!this.sessionStore.session()?.branch?.id) return;
    void this.router.navigate(
      ['/app/trading/gst-reconciliation/detail', cell.returnType, cell.month],
      { queryParams: { burl: this.router.url } },
    );
  }

  protected async refreshMonth(cell: GstReconciliationMonthCell): Promise<void> {
    if (this.store.isBusy() || this.refreshingCell()) return;

    const key = gstReconciliationMonthDifferenceKey(cell);
    this.refreshingCell.set(key);
    this.store.clearRefreshResult();
    this.forgetLoadedDifferenceKeys(key);
    this.monthDifferenceAmounts.update((current) => {
      const { [key]: _removed, ...remaining } = current;
      return remaining;
    });
    this.monthDisplayOverrides.update((current) => {
      const { [key]: _removed, ...remaining } = current;
      return remaining;
    });

    try {
      await this.store.refresh({ returnType: cell.returnType, month: cell.month });
      await this.store.loadSummary();
    } finally {
      this.refreshingCell.set(null);
    }
  }

  protected currencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.fiscalyear?.currencycode ??
      this.sessionStore.session()?.branch?.currencycode
    );
  }

  private fiscalYearStartYear(): number {
    const fy = this.sessionStore.session()?.fiscalyear;
    const fromDate = fy?.startdate ? new Date(fy.startdate).getFullYear() : NaN;
    if (Number.isFinite(fromDate)) return fromDate;
    const fromName = fy?.name?.match(/\d{4}/)?.[0];
    return fromName ? Number(fromName) : new Date().getFullYear();
  }

  private async hydrateMonthDifferences(
    months: readonly GstReconciliationMonthSummary[],
  ): Promise<void> {
    const cached = this.monthDifferenceAmounts();
    const candidates = months.filter((month) => {
      const key = gstReconciliationMonthDifferenceKey(month);
      const signature = this.monthDifferenceSignature(month);
      return (
        month.status !== 'upcoming' &&
        (month.booksInvoiceCount > 0 || month.gstInvoiceCount > 0) &&
        (cached[key] === undefined || !this.loadedDifferenceKeys.has(signature)) &&
        !this.loadingDifferenceKeys.has(signature)
      );
    });

    await Promise.all(
      candidates.map(async (month) => {
        const key = gstReconciliationMonthDifferenceKey(month);
        const signature = this.monthDifferenceSignature(month);
        this.loadingDifferenceKeys.add(signature);
        try {
          const detail = await this.reconciliationService.loadDetail(month.returnType, month.month);
          const displaySummary = this.detailDisplaySummary(
            detail.groups.flatMap((group) => group.rows),
          );
          const differenceAmount = displaySummary.differenceAmount;
          this.monthDifferenceAmounts.update((current) => ({ ...current, [key]: differenceAmount }));
          this.monthDisplayOverrides.update((current) => ({
            ...current,
            [key]: displaySummary,
          }));
          this.loadedDifferenceKeys.add(signature);
        } catch {
          this.monthDifferenceAmounts.update((current) => ({
            ...current,
            [key]: month.differenceAmount ?? 0,
          }));
          this.loadedDifferenceKeys.add(signature);
        } finally {
          this.loadingDifferenceKeys.delete(signature);
        }
      }),
    );
  }

  private forgetLoadedDifferenceKeys(key: string): void {
    for (const loadedKey of [...this.loadedDifferenceKeys]) {
      if (loadedKey.startsWith(`${key}|`)) this.loadedDifferenceKeys.delete(loadedKey);
    }
  }

  private monthDifferenceSignature(month: GstReconciliationMonthSummary): string {
    return [
      gstReconciliationMonthDifferenceKey(month),
      month.status,
      month.booksInvoiceCount,
      month.gstInvoiceCount,
      month.matchedCount,
      month.partialCount,
      month.mismatchCount,
      month.differenceAmount,
    ].join('|');
  }

  private rowDifferenceAmount(row: GstReconciliationDetailRow): number {
    if (!row.booksInvoice || !row.gstInvoice) {
      return row.differenceAmount ?? 0;
    }

    return this.roundAmount(Math.abs(
      this.bookInvoiceReconciliationValue(row.booksInvoice) -
        (row.gstInvoice.invoiceValue ?? 0),
    ));
  }

  private detailDisplaySummary(rows: readonly GstReconciliationDetailRow[]): MonthDisplayOverride {
    const counts = {
      matchedCount: 0,
      mismatchCount: 0,
      partialCount: 0,
    };
    let differenceAmount = 0;

    for (const row of rows) {
      const difference = this.rowDifferenceAmount(row);
      differenceAmount = this.roundAmount(differenceAmount + difference);

      if (row.booksInvoice && row.gstInvoice) {
        if (difference <= GST_AMOUNT_TOLERANCE) {
          counts.matchedCount += 1;
        } else {
          counts.partialCount += 1;
        }
        continue;
      }

      if (row.booksInvoice || row.gstInvoice) {
        counts.mismatchCount += 1;
      }
    }

    return {
      ...counts,
      differenceAmount,
      status: this.displayStatus(counts),
    };
  }

  private displayStatus(counts: {
    matchedCount: number;
    mismatchCount: number;
    partialCount: number;
  }): GstReconciliationStatus {
    if (counts.matchedCount > 0 && counts.partialCount === 0 && counts.mismatchCount === 0) {
      return 'matched';
    }

    if (counts.matchedCount === 0 && (counts.partialCount > 0 || counts.mismatchCount > 0)) {
      return 'noMatch';
    }

    if (counts.matchedCount > 0 || counts.partialCount > 0) {
      return 'partialMatch';
    }

    return 'pending';
  }

  private bookInvoiceReconciliationValue(invoice: GstReconciliationInvoice): number {
    return this.convertedInvoiceValue(invoice, 'invoiceValue');
  }

  private convertedInvoiceValue(
    invoice: GstReconciliationInvoice,
    amountKey: 'taxableValue' | 'totalTax' | 'invoiceValue',
  ): number {
    const value = invoice[amountKey] ?? 0;

    if (!this.shouldConvertInvoice(invoice)) {
      return value;
    }

    const explicitConvertedValue = this.explicitConvertedInvoiceValue(invoice, amountKey);
    if (explicitConvertedValue !== null) return explicitConvertedValue;

    return value * this.invoiceConversionRate(invoice);
  }

  private shouldConvertInvoice(invoice: GstReconciliationInvoice): boolean {
    const invoiceCurrency = this.invoiceCurrencyCode(invoice);
    const branchCurrency = this.branchCurrencyCode();

    return !!invoiceCurrency && !!branchCurrency && invoiceCurrency !== branchCurrency;
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

  private branchCurrencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.branch?.currencycode ??
      this.sessionStore.session()?.fiscalyear?.currencycode
    );
  }

  private numericValue(value: unknown): number | null {
    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private roundAmount(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
