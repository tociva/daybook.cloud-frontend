import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import type { FiscalYearDateRange } from '../../../../../../shared/fiscal-year-date-range-picker';

export type ReportDateQuery = Readonly<{
  end?: string;
  start?: string;
}>;

export type ReportDateRouterQuery = Readonly<{
  end: string | null;
  start: string | null;
}>;

export function seedMissingReportDateQuery(
  start: string | null,
  end: string | null,
  range: FiscalYearDateRange,
): ReportDateRouterQuery | null {
  if (start && end) return null;

  return {
    start: start ?? range.startdate,
    end: end ?? range.enddate,
  };
}

export function parseIsoDateToDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;

  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}

export function buildReportDateQuery(
  start: string | null | undefined,
  end: string | null | undefined,
): ReportDateQuery {
  return {
    ...(start ? { start } : {}),
    ...(end ? { end } : {}),
  };
}

export function buildReportDateRouterQueryFromPicker(
  value: TngDateRangePickerSelectionInput<Date>,
  toIsoDate: (value: unknown) => string | null,
): ReportDateRouterQuery | null {
  if (!value || typeof value !== 'object' || value instanceof Date) return null;

  return {
    start: value.start ? toIsoDate(value.start) : null,
    end: value.end ? toIsoDate(value.end) : null,
  };
}
