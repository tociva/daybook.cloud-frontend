import { computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import { ToastStore } from '../../../../../../../core/toast/toast.store';
import {
  getDownloadErrorMessage,
  startSignedDownload,
} from '../../../../../../../shared/file/signed-url-download.service';
import {
  GstReconciliationStore,
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
  protected readonly permissions = inject(PermissionsStore);
  protected readonly sessionStore = inject(UserSessionStore);
  protected readonly store = inject(GstReconciliationStore);
  private readonly service = inject(GstReconciliationService);
  private readonly toastStore = inject(ToastStore);

  protected readonly refreshingCell = signal<string | null>(null);
  protected readonly downloadingCells = signal<ReadonlySet<string>>(new Set());
  protected readonly canDownload = computed(() =>
    this.permissions.can(PERMISSION.fiscalYear.gstReconciliation.view),
  );

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
    if (
      !this.permissions.can(PERMISSION.fiscalYear.gstReconciliation.bulkUpload) ||
      this.store.isBusy() ||
      this.refreshingCell()
    ) return;

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

  protected async downloadMonth(cell: GstReconciliationMonthCell): Promise<void> {
    const key = gstReconciliationMonthDifferenceKey(cell);
    if (cell.status === 'upcoming' || !this.canDownload() || this.downloadingCells().has(key)) return;

    this.setCellDownloading(key, true);
    try {
      const response = await this.service.getDownloadUrl(cell.returnType, cell.month);
      startSignedDownload(response);
    } catch (error) {
      this.toastStore.danger(getDownloadErrorMessage(error, 'Failed to download GST return file.'));
    } finally {
      this.setCellDownloading(key, false);
    }
  }

  protected currencyCode(): string | undefined {
    return (
      this.sessionStore.session()?.fiscalyear?.currencycode ??
      this.sessionStore.session()?.branch?.currencycode
    );
  }

  private setCellDownloading(key: string, downloading: boolean): void {
    this.downloadingCells.update((current) => {
      const next = new Set(current);
      if (downloading) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  private fiscalYearStartYear(): number {
    const fy = this.sessionStore.session()?.fiscalyear;
    const fromDate = fy?.startdate ? new Date(fy.startdate).getFullYear() : NaN;
    if (Number.isFinite(fromDate)) return fromDate;
    const fromName = fy?.name?.match(/\d{4}/)?.[0];
    return fromName ? Number(fromName) : new Date().getFullYear();
  }
}
