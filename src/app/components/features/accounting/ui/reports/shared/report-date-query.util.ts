import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import type { FiscalYearDateRange } from '../../../../../../shared/fiscal-year-date-range-picker';

export type ReportDateOperator = 'between' | 'eq' | 'ge' | 'le';

export type ReportDateQuery = Readonly<{
  end?: string;
  start?: string;
}>;

export type ReportDateRouterQuery = Readonly<{
  dateOperator?: ReportDateOperator;
  end?: string | null;
  start?: string | null;
}>;

export type ReportDateOperatorOption = Readonly<{
  label: string;
  value: ReportDateOperator;
}>;

export const DEFAULT_REPORT_DATE_OPERATOR: ReportDateOperator = 'between';
export const REPORT_DATE_OPERATOR_QUERY_PARAM = 'dateOperator';

export const REPORT_DATE_OPERATOR_OPTIONS: readonly ReportDateOperatorOption[] = [
  { label: 'Between', value: 'between' },
  { label: 'Equal to', value: 'eq' },
  { label: 'Greater or equal', value: 'ge' },
  { label: 'Less or equal', value: 'le' },
];

export function parseReportDateOperator(value: string | null | undefined): ReportDateOperator {
  if (value === '=' || value === 'eq') return 'eq';
  if (value === '>=' || value === 'ge' || value === 'gte') return 'ge';
  if (value === '<=' || value === 'le' || value === 'lte') return 'le';

  return DEFAULT_REPORT_DATE_OPERATOR;
}

export function seedMissingReportDateQuery(
  start: string | null,
  end: string | null,
  range: FiscalYearDateRange,
  operator: ReportDateOperator = DEFAULT_REPORT_DATE_OPERATOR,
): ReportDateRouterQuery | null {
  if (operator === 'eq') {
    return start || end
      ? null
      : {
          dateOperator: operator,
          start: range.startdate,
        };
  }

  if (operator === 'ge') {
    return start
      ? null
      : {
          dateOperator: operator,
          start: range.startdate,
        };
  }

  if (operator === 'le') {
    return end
      ? null
      : {
          dateOperator: operator,
          end: range.enddate,
        };
  }

  if (start && end) return null;

  return {
    dateOperator: operator,
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
  operator: ReportDateOperator = DEFAULT_REPORT_DATE_OPERATOR,
): ReportDateQuery {
  if (operator === 'eq') {
    const date = start ?? end;

    return date ? { start: date, end: date } : {};
  }

  if (operator === 'ge') {
    return start ? { start } : {};
  }

  if (operator === 'le') {
    return end ? { end } : {};
  }

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

export function buildReportDateRouterQueryFromSelection(
  operator: ReportDateOperator,
  rangeValue: TngDateRangePickerSelectionInput<Date>,
  singleValue: Date | null,
  toIsoDate: (value: unknown) => string | null,
): ReportDateRouterQuery | null {
  if (operator === DEFAULT_REPORT_DATE_OPERATOR) {
    const query = buildReportDateRouterQueryFromPicker(rangeValue, toIsoDate);

    return query
      ? {
          dateOperator: operator,
          ...query,
        }
      : null;
  }

  const date = singleValue ? toIsoDate(singleValue) : null;
  if (!date) return null;

  if (operator === 'le') {
    return {
      dateOperator: operator,
      end: date,
    };
  }

  return {
    dateOperator: operator,
    start: date,
  };
}

export function reportDatePickerValueFromQuery(
  operator: ReportDateOperator,
  start: string | null | undefined,
  end: string | null | undefined,
): TngDateRangePickerSelectionInput<Date> {
  if (operator === 'eq') {
    const date = parseIsoDateToDate(start ?? end);

    return {
      start: date,
      end: date,
    };
  }

  if (operator === 'ge') {
    return {
      start: parseIsoDateToDate(start),
      end: null,
    };
  }

  if (operator === 'le') {
    return {
      start: null,
      end: parseIsoDateToDate(end),
    };
  }

  return {
    start: parseIsoDateToDate(start),
    end: parseIsoDateToDate(end),
  };
}
