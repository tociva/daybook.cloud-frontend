import { describe, expect, it } from 'vitest';
import {
  buildReportDateQuery,
  buildReportDateRouterQueryFromPicker,
  parseIsoDateToDate,
  seedMissingReportDateQuery,
} from './report-date-query.util';

const fiscalYearRange = {
  startdate: '2026-04-01',
  enddate: '2027-03-31',
  name: 'FY 2026-27',
};

describe('report date query utilities', () => {
  it('seeds missing start/end dates from the fiscal year range', () => {
    expect(seedMissingReportDateQuery(null, null, fiscalYearRange)).toEqual({
      start: '2026-04-01',
      end: '2027-03-31',
    });
    expect(seedMissingReportDateQuery('2026-05-01', null, fiscalYearRange)).toEqual({
      start: '2026-05-01',
      end: '2027-03-31',
    });
    expect(seedMissingReportDateQuery('2026-05-01', '2026-05-31', fiscalYearRange)).toBeNull();
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
});
