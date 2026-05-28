import { computed, inject, Injectable, signal } from '@angular/core';
import type { TngDateRangePickerValue } from '@tailng-ui/components';
import { FiscalYearDateRangeService } from './fiscal-year-date-range.service';

export type DateRangeValue = {
  start: string | null;
  end: string | null;
};

/**
 * Service to manage fiscal year constrained date range state.
 * Handles conversion between Date objects and ISO date strings.
 * Used by components that need date range filtering within fiscal year.
 */
@Injectable({ providedIn: 'root' })
export class FiscalYearDateRangeStateService {
  private readonly fiscalYearService = inject(FiscalYearDateRangeService);

  private readonly _dateRange = signal<DateRangeValue>({
    start: null,
    end: null,
  });

  readonly dateRange = this._dateRange.asReadonly();

  readonly hasStartDate = computed(() => this._dateRange().start !== null);
  readonly hasEndDate = computed(() => this._dateRange().end !== null);
  readonly hasDateRange = computed(() => this.hasStartDate() || this.hasEndDate());

  /**
   * Handle date range picker value change
   * Converts Date objects to ISO date strings and updates state
   */
  setDateRange(value: TngDateRangePickerValue<Date> | null): void {
    if (value && (value.start || value.end)) {
      this._dateRange.set({
        start: value.start ? this.fiscalYearService.toIsoDate(value.start) : null,
        end: value.end ? this.fiscalYearService.toIsoDate(value.end) : null,
      });
    } else {
      this._dateRange.set({ start: null, end: null });
    }
  }

  /**
   * Clear the date range
   */
  clearDateRange(): void {
    this._dateRange.set({ start: null, end: null });
  }

  /**
   * Get the current date range
   */
  getDateRange(): DateRangeValue {
    return this._dateRange();
  }

  /**
   * Get start date as string (YYYY-MM-DD)
   */
  getStartDate(): string | null {
    return this._dateRange().start;
  }

  /**
   * Get end date as string (YYYY-MM-DD)
   */
  getEndDate(): string | null {
    return this._dateRange().end;
  }

  /**
   * Build query object with date range for API calls
   */
  buildQuery<T extends Record<string, any>>(additionalParams?: T): T & { start?: string; end?: string } {
    const range = this._dateRange();
    const query: any = { ...additionalParams };

    if (range.start) {
      query.start = range.start;
    }
    if (range.end) {
      query.end = range.end;
    }

    return query;
  }
}
