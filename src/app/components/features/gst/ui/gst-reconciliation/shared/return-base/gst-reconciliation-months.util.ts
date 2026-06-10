import type {
  GstReconciliationMonthSummary,
  GstReconciliationReturnType,
  GstReconciliationStatus,
} from '../../../../data/gst-reconciliation/gst-reconciliation.store';
import type { GstReconciliationMonthCell } from '../../gst-reconciliation.types';

export const GST_RECONCILIATION_MONTH_OPTIONS: readonly { label: string; value: number }[] = [
  { label: 'April', value: 4 },    { label: 'May', value: 5 },
  { label: 'June', value: 6 },     { label: 'July', value: 7 },
  { label: 'August', value: 8 },   { label: 'September', value: 9 },
  { label: 'October', value: 10 }, { label: 'November', value: 11 },
  { label: 'December', value: 12 },{ label: 'January', value: 1 },
  { label: 'February', value: 2 }, { label: 'March', value: 3 },
] as const;

const EMPTY_MONTH = {
  booksInvoiceCount: 0,
  differenceAmount: 0,
  gstInvoiceCount: 0,
  matchedCount: 0,
  mismatchCount: 0,
  partialCount: 0,
} as const;

export function buildGstReconciliationMonthCells(params: {
  fiscalYearStartYear: number;
  returnType: GstReconciliationReturnType;
  summaries: readonly GstReconciliationMonthSummary[];
  today?: Date;
}): readonly GstReconciliationMonthCell[] {
  const today = params.today ?? new Date();

  return GST_RECONCILIATION_MONTH_OPTIONS.map((option) => {
    const existing = params.summaries.find((summary) => summary.month === option.value);
    const year = option.value >= 4
      ? params.fiscalYearStartYear
      : params.fiscalYearStartYear + 1;

    return {
      ...EMPTY_MONTH,
      ...existing,
      returnType: params.returnType,
      month: option.value,
      status: existing?.status ?? missingGstReconciliationMonthStatus(
        option.value,
        params.fiscalYearStartYear,
        today,
      ),
      label: option.label.slice(0, 3),
      period: `${option.label.slice(0, 3)} ${year}`,
    };
  });
}

export function gstReconciliationMonthDifferenceKey(
  cell: Pick<GstReconciliationMonthCell, 'month' | 'returnType'>,
): string {
  return `${cell.returnType}-${cell.month}`;
}

function missingGstReconciliationMonthStatus(
  month: number,
  fiscalYearStartYear: number,
  today: Date,
): GstReconciliationStatus {
  return new Date(month >= 4 ? fiscalYearStartYear : fiscalYearStartYear + 1, month - 1, 1) > today
    ? 'upcoming'
    : 'pending';
}
