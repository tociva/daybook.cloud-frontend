import { computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationMonthSummary,
  type GstReconciliationReturnType,
} from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import { GstReconciliationService } from '../../../../data/gst-reconciliation/gst-reconciliation.service';
import type { GstReconciliationMonthCell } from '../../gst-reconciliation.types';
import {
  buildGstReconciliationMonthCells,
  gstReconciliationMonthDifferenceKey,
} from './gst-reconciliation-months.util';

export abstract class GstReconciliationReturnBase {
  protected readonly router = inject(Router);
  protected readonly sessionStore = inject(UserSessionStore);
  protected readonly reconciliationService = inject(GstReconciliationService);
  protected readonly store = inject(GstReconciliationStore);

  protected readonly refreshingCell = signal<string | null>(null);
  protected readonly monthDifferenceAmounts = signal<Readonly<Record<string, number>>>({});

  private readonly loadedDifferenceKeys = new Set<string>();
  private readonly loadingDifferenceKeys = new Set<string>();

  protected readonly months = computed(() =>
    buildGstReconciliationMonthCells({
      fiscalYearStartYear: this.fiscalYearStartYear(),
      returnType: this.returnType,
      summaries: this.store.summary()?.[this.returnType] ?? [],
    }),
  );

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
          this.monthDifferenceAmounts.update((current) => ({
            ...current,
            [key]: detail.summary.differenceAmount ?? 0,
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
}
