import { Component, input, output } from '@angular/core';
import {
  TngButtonComponent,
  TngCardComponent,
  TngTag,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { formatAmountWithCurrency } from '../../../../../../../shared/format/currency';
import type { GstReconciliationStatus } from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import type {
  GstReconciliationMonthCell,
  ReturnTypeMeta,
} from '../../gst-reconciliation.types';
import {
  gstReconciliationMonthDifferenceKey,
} from '../gst-reconciliation-months.util';
import {
  GST_RECONCILIATION_STATUS_LEGEND,
  gstReconciliationStatusIcon,
  gstReconciliationStatusLabel,
  gstReconciliationStatusTone,
  totalGstReconciliationMonthsByStatus,
} from '../gst-reconciliation-status.util';

@Component({
  selector: 'app-gst-reconciliation-return-panel',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngTag,
    TngIcon,
  ],
  templateUrl: './gst-reconciliation-return-panel.component.html',
  styleUrl: './gst-reconciliation-return-panel.component.css',
})
export class GstReconciliationReturnPanelComponent {
  readonly meta = input.required<ReturnTypeMeta>();
  readonly months = input.required<readonly GstReconciliationMonthCell[]>();
  readonly canImport = input(false);
  readonly contextAvailable = input(false);
  readonly isBusy = input(false);
  readonly isParsing = input(false);
  readonly isUploading = input(false);
  readonly refreshingCellKey = input<string | null>(null);
  readonly monthDifferenceAmounts = input<Readonly<Record<string, number>>>({});
  readonly currencyCode = input<string | undefined>(undefined);

  readonly importRequested = output<ReturnTypeMeta['value']>();
  readonly monthOpened = output<GstReconciliationMonthCell>();
  readonly refreshRequested = output<GstReconciliationMonthCell>();

  protected readonly statusLegend = GST_RECONCILIATION_STATUS_LEGEND;

  protected requestImport(): void {
    this.importRequested.emit(this.meta().value);
  }

  protected refreshClicked(event: Event, cell: GstReconciliationMonthCell): void {
    event.stopPropagation();
    this.refreshRequested.emit(cell);
  }

  protected cellKey(cell: GstReconciliationMonthCell): string {
    return gstReconciliationMonthDifferenceKey(cell);
  }

  protected isRefreshingCell(cell: GstReconciliationMonthCell): boolean {
    return this.refreshingCellKey() === this.cellKey(cell);
  }

  protected statusLabel = gstReconciliationStatusLabel;
  protected statusIcon = gstReconciliationStatusIcon;
  protected statusTone = gstReconciliationStatusTone;

  protected totalByStatus(status: GstReconciliationStatus): number {
    return totalGstReconciliationMonthsByStatus(this.months(), status);
  }

  protected formatAmount(value: number | null | undefined): string {
    return formatAmountWithCurrency(value ?? 0, this.currencyCode());
  }

  protected monthDifferenceAmount(cell: GstReconciliationMonthCell): number {
    return this.monthDifferenceAmounts()[this.cellKey(cell)] ?? cell.differenceAmount ?? 0;
  }

  protected hasMonthDifference(cell: GstReconciliationMonthCell): boolean {
    return this.monthDifferenceAmount(cell) !== 0;
  }
}
