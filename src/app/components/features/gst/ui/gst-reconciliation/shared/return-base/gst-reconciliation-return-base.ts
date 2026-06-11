import { computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import {
  GstReconciliationStore,
  type GstReconciliationReturnType,
} from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import type { GstReconciliationMonthCell } from '../../gst-reconciliation.types';
import {
  buildGstReconciliationMonthCells,
  gstReconciliationMonthDifferenceKey,
} from './gst-reconciliation-months.util';

export abstract class GstReconciliationReturnBase {
  protected readonly router = inject(Router);
  protected readonly sessionStore = inject(UserSessionStore);
  protected readonly store = inject(GstReconciliationStore);

  protected readonly refreshingCell = signal<string | null>(null);

  protected readonly months = computed(() =>
    buildGstReconciliationMonthCells({
      fiscalYearStartYear: this.fiscalYearStartYear(),
      returnType: this.returnType,
      summaries: this.store.summary()?.[this.returnType] ?? [],
    }),
  );

  protected constructor(protected readonly returnType: GstReconciliationReturnType) {}

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
}
