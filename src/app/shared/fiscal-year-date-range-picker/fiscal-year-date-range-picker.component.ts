import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TngDateRangePickerComponent } from '@tailng-ui/components';
import type { TngDateRangePickerSelectionInput, TngDateRangePickerValue } from '@tailng-ui/components';
import type { TngDateRangePickerCloseReason } from '@tailng-ui/primitives';
import { DatepickerDateAdapterService } from '../../core/date/datepicker-date-adapter.service';
import { FiscalYearDateRangeService } from './fiscal-year-date-range.service';

@Component({
  selector: 'app-fiscal-year-date-range-picker',
  standalone: true,
  imports: [TngDateRangePickerComponent],
  templateUrl: './fiscal-year-date-range-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiscalYearDateRangePickerComponent {
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  protected readonly dateRange = inject(FiscalYearDateRangeService);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly id = input<string | null>(null);
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select date range');
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly value = input<TngDateRangePickerSelectionInput<Date>>(null);

  readonly closed = output<TngDateRangePickerCloseReason>();
  readonly valueChange = output<TngDateRangePickerValue<Date>>();

  protected readonly pickerInvalid = computed(() => {
    if (this.invalid()) return true;

    const val = this.value();
    if (!val || typeof val !== 'object' || val instanceof Date) return false;

    const { start, end } = val as Readonly<{ start?: unknown; end?: unknown }>;

    return (
      (start != null && !this.dateRange.isWithinFiscalYear(start)) ||
      (end != null && !this.dateRange.isWithinFiscalYear(end))
    );
  });

  protected readonly disableDate = computed(
    () =>
      (date: Date): boolean =>
        !this.dateRange.isWithinFiscalYear(date),
  );

  protected onValueChange(value: TngDateRangePickerSelectionInput<Date>): void {
    this.valueChange.emit(this.toRangeValue(value));
  }

  private toRangeValue(
    value: TngDateRangePickerSelectionInput<Date>,
  ): TngDateRangePickerValue<Date> {
    if (value == null) return null;
    if (value instanceof Date) {
      return { start: value, end: value };
    }
    if (typeof value === 'object') {
      return {
        start: this.resolveDate(value.start),
        end: this.resolveDate(value.end),
      };
    }

    return null;
  }

  private resolveDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string') return this.datepickerAdapter.adapter().parse(value);

    return null;
  }
}
