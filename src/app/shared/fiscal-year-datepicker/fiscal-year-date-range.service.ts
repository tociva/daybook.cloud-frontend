import { computed, inject, Injectable } from '@angular/core';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { DEFAULT_DISPLAY_DATE_FORMAT, parseIsoDate } from '../../core/date/dayjs-date.utils';

export type FiscalYearDateRange = Readonly<{
  enddate: string;
  name: string | null;
  startdate: string;
}>;

@Injectable({ providedIn: 'root' })
export class FiscalYearDateRangeService {
  private readonly userSessionStore = inject(UserSessionStore);

  readonly range = computed<FiscalYearDateRange | null>(() => {
    const fiscalYear = this.userSessionStore.session()?.fiscalyear;
    if (!fiscalYear?.startdate || !fiscalYear?.enddate) {
      return null;
    }

    const startdate = this.toIsoDate(fiscalYear.startdate);
    const enddate = this.toIsoDate(fiscalYear.enddate);
    if (!startdate || !enddate || enddate < startdate) {
      return null;
    }

    return {
      enddate,
      name: fiscalYear.name ?? null,
      startdate,
    };
  });

  readonly minDate = computed(() => this.range()?.startdate ?? null);
  readonly maxDate = computed(() => this.range()?.enddate ?? null);

  defaultDate(fallback = dayjs().format('YYYY-MM-DD')): string {
    const fallbackDate = this.toIsoDate(fallback) ?? dayjs().format('YYYY-MM-DD');
    const range = this.range();
    if (!range) {
      return fallbackDate;
    }

    if (fallbackDate < range.startdate) {
      return range.startdate;
    }

    if (fallbackDate > range.enddate) {
      return range.enddate;
    }

    return fallbackDate;
  }

  errorMessage(value: unknown, label = 'Date'): string | null {
    const range = this.range();
    if (!range || !value) {
      return null;
    }

    const isoDate = this.toIsoDate(value);
    if (!isoDate) {
      return `${label} must be a valid date.`;
    }

    if (isoDate < range.startdate || isoDate > range.enddate) {
      return `${label} must be within ${this.formatForMessage(range.startdate)} and ${this.formatForMessage(range.enddate)}.`;
    }

    return null;
  }

  isWithinFiscalYear(value: unknown): boolean {
    return this.errorMessage(value) === null;
  }

  toIsoDate(value: unknown): string | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return dayjs(value).format('YYYY-MM-DD');
    }

    if (dayjs.isDayjs(value)) {
      return this.formatDayjs(value);
    }

    if (typeof value === 'string') {
      const parsed = parseIsoDate(value);
      return parsed?.format('YYYY-MM-DD') ?? null;
    }

    return null;
  }

  private formatDayjs(value: Dayjs): string | null {
    return value.isValid() ? value.format('YYYY-MM-DD') : null;
  }

  private formatForMessage(value: string): string {
    return parseIsoDate(value)?.format(DEFAULT_DISPLAY_DATE_FORMAT) ?? value;
  }
}
