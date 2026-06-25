import { describe, expect, it } from 'vitest';
import {
  buildReportDateQuery,
  buildReportDateRouterQueryFromSelection,
  buildReportDateRouterQueryFromPicker,
  parseReportDateOperator,
  reportDatePickerValueFromQuery,
  parseIsoDateToDate,
  seedMissingReportDateQuery,
} from './report-date-query.util';

const fiscalYearRange = {
  startdate: '2026-04-01',
  enddate: '2027-03-31',
  name: 'FY 2026-27',
};

const localDate = (year: number, month: number, day: number): Date =>
  new Date(year, month - 1, day);

describe('report date query utilities', () => {
  it('seeds missing start/end dates from the fiscal year range', () => {
    expect(seedMissingReportDateQuery(null, null, fiscalYearRange)).toEqual({
      dateOperator: 'between',
      start: '2026-04-01',
      end: '2027-03-31',
    });
    expect(seedMissingReportDateQuery('2026-05-01', null, fiscalYearRange)).toEqual({
      dateOperator: 'between',
      start: '2026-05-01',
      end: '2027-03-31',
    });
    expect(seedMissingReportDateQuery('2026-05-01', '2026-05-31', fiscalYearRange)).toBeNull();
  });

  it('does not expand operator-specific single-bound date queries', () => {
    expect(seedMissingReportDateQuery('2026-05-01', null, fiscalYearRange, 'ge')).toBeNull();
    expect(seedMissingReportDateQuery(null, '2026-05-31', fiscalYearRange, 'le')).toBeNull();
    expect(seedMissingReportDateQuery('2026-05-15', null, fiscalYearRange, 'eq')).toBeNull();
  });

  it('seeds missing operator-specific dates from the fiscal year range', () => {
    expect(seedMissingReportDateQuery(null, null, fiscalYearRange, 'ge')).toEqual({
      dateOperator: 'ge',
      start: '2026-04-01',
    });
    expect(seedMissingReportDateQuery(null, null, fiscalYearRange, 'le')).toEqual({
      dateOperator: 'le',
      end: '2027-03-31',
    });
    expect(seedMissingReportDateQuery(null, null, fiscalYearRange, 'eq')).toEqual({
      dateOperator: 'eq',
      start: '2026-04-01',
    });
  });

  it('converts ISO date strings to local Date objects', () => {
    const date = parseIsoDateToDate('2026-05-17');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(17);
    expect(parseIsoDateToDate('not-a-date')).toBeNull();
  });

  it('builds sparse API date queries', () => {
    expect(buildReportDateQuery('2026-04-01', null)).toEqual({ start: '2026-04-01' });
    expect(buildReportDateQuery(undefined, '2027-03-31')).toEqual({ end: '2027-03-31' });
    expect(buildReportDateQuery('2026-04-15', null, 'eq')).toEqual({
      start: '2026-04-15',
      end: '2026-04-15',
    });
    expect(buildReportDateQuery('2026-04-15', '2026-04-30', 'ge')).toEqual({
      start: '2026-04-15',
    });
    expect(buildReportDateQuery('2026-04-15', '2026-04-30', 'le')).toEqual({
      end: '2026-04-30',
    });
  });

  it('converts picker close values into router query params', () => {
    const query = buildReportDateRouterQueryFromPicker(
      {
        start: new Date(2026, 3, 1),
        end: null,
      },
      (value) => {
        const date = value as Date;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
          date.getDate(),
        ).padStart(2, '0')}`;
      },
    );

    expect(query).toEqual({
      start: '2026-04-01',
      end: null,
    });
  });

  it('builds operator-specific router query params from draft selections', () => {
    const toIsoDate = (value: unknown): string => {
      const date = value as Date;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate(),
      ).padStart(2, '0')}`;
    };

    expect(
      buildReportDateRouterQueryFromSelection(
        'between',
        {
          start: new Date(2026, 3, 1),
          end: new Date(2026, 3, 30),
        },
        null,
        toIsoDate,
      ),
    ).toEqual({
      dateOperator: 'between',
      start: '2026-04-01',
      end: '2026-04-30',
    });
    expect(
      buildReportDateRouterQueryFromSelection('eq', null, new Date(2026, 3, 15), toIsoDate),
    ).toEqual({
      dateOperator: 'eq',
      start: '2026-04-15',
    });
    expect(
      buildReportDateRouterQueryFromSelection('ge', null, new Date(2026, 3, 15), toIsoDate),
    ).toEqual({
      dateOperator: 'ge',
      start: '2026-04-15',
    });
    expect(
      buildReportDateRouterQueryFromSelection('le', null, new Date(2026, 3, 30), toIsoDate),
    ).toEqual({
      dateOperator: 'le',
      end: '2026-04-30',
    });
  });

  it('parses and maps report date operators from route params', () => {
    expect(parseReportDateOperator('eq')).toBe('eq');
    expect(parseReportDateOperator('ge')).toBe('ge');
    expect(parseReportDateOperator('le')).toBe('le');
    expect(parseReportDateOperator('=')).toBe('eq');
    expect(parseReportDateOperator('>=')).toBe('ge');
    expect(parseReportDateOperator('<=')).toBe('le');
    expect(parseReportDateOperator('gte')).toBe('ge');
    expect(parseReportDateOperator('lte')).toBe('le');
    expect(parseReportDateOperator('unknown')).toBe('between');
  });

  it('converts route query params into picker ranges for each operator', () => {
    expect(reportDatePickerValueFromQuery('eq', '2026-04-15', null)).toEqual({
      start: localDate(2026, 4, 15),
      end: localDate(2026, 4, 15),
    });
    expect(reportDatePickerValueFromQuery('ge', '2026-04-15', null)).toEqual({
      start: localDate(2026, 4, 15),
      end: null,
    });
    expect(reportDatePickerValueFromQuery('le', null, '2026-04-30')).toEqual({
      start: null,
      end: localDate(2026, 4, 30),
    });
  });
});
