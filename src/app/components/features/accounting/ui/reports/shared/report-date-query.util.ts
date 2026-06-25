import type { TngDateRangePickerSelectionInput } from '@tailng-ui/components';
import type { FiscalYearDateRange } from '../../../../../../shared/fiscal-year-date-range-picker';

export type ReportDateOperator = 'between' | '=' | '>=' | '<=';

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
  { label: 'Equal to', value: '=' },
  { label: 'Greater or equal', value: '>=' },
  { label: 'Less or equal', value: '<=' },
];

export function parseReportDateOperator(value: string | null | undefined): ReportDateOperator {
  return value === '=' || value === '>=' || value === '<=' ? value : DEFAULT_REPORT_DATE_OPERATOR;
}

export function seedMissingReportDateQuery(
  start: string | null,
  end: string | null,
  range: FiscalYearDateRange,
  operator: ReportDateOperator = DEFAULT_REPORT_DATE_OPERATOR,
): ReportDateRouterQuery | null {
  if (operator === '=') {
    return start || end
      ? null
      : {
          dateOperator: operator,
          start: range.startdate,
        };
  }

  if (operator === '>=') {
    return start
      ? null
      : {
          dateOperator: operator,
          start: range.startdate,
        };
  }

  if (operator === '<=') {
    return end
      ? null
      : {
          dateOperator: operator,
          end: range.enddate,
        };
  }

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
  operator: ReportDateOperator = DEFAULT_REPORT_DATE_OPERATOR,
): ReportDateQuery {
  if (operator === '=') {
    const date = start ?? end;

    return date ? { start: date, end: date } : {};
  }

  if (operator === '>=') {
    return start ? { start } : {};
  }

  if (operator === '<=') {
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
    return buildReportDateRouterQueryFromPicker(rangeValue, toIsoDate);
  }

  const date = singleValue ? toIsoDate(singleValue) : null;
  if (!date) return null;

  if (operator === '<=') {
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
  if (operator === '=') {
    const date = parseIsoDateToDate(start ?? end);

    return {
      start: date,
      end: date,
    };
  }

  if (operator === '>=') {
    return {
      start: parseIsoDateToDate(start),
      end: null,
    };
  }

  if (operator === '<=') {
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
