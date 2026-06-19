import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { TngDatepickerComponent } from '@tailng-ui/components';
import type { TngDateInputValue, TngDateSelectionInput, TngDateValue } from '@tailng-ui/primitives';
import { DatepickerDateAdapterService } from '../../core/date/datepicker-date-adapter.service';
import { FiscalYearDateRangeService } from '../fiscal-year-date-range-picker/fiscal-year-date-range.service';

@Component({
  selector: 'app-fiscal-year-datepicker',
  standalone: true,
  imports: [TngDatepickerComponent],
  templateUrl: './fiscal-year-datepicker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: block; width: 100%;' },
})
export class FiscalYearDatepickerComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly datepickerAdapter = inject(DatepickerDateAdapterService);
  protected readonly dateRange = inject(FiscalYearDateRangeService);

  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(true, { transform: booleanAttribute });
  readonly id = input<string | null>(null);
  readonly inputAriaLabel = input('Choose date');
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly placeholder = input('Select date');
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly today = input<TngDateInputValue<Date>>(undefined);
  readonly value = input<TngDateSelectionInput<Date>>(null);

  readonly valueChange = output<TngDateValue<Date>>();

  protected readonly datepickerInvalid = computed(
    () => this.invalid() || !this.dateRange.isWithinFiscalYear(this.value()),
  );

  protected readonly disableDate = computed(
    () =>
      (date: Date): boolean =>
        !this.dateRange.isWithinFiscalYear(date),
  );

  focusInput(): void {
    this.hostElement.nativeElement
      .querySelector<HTMLInputElement>('input[data-slot="datepicker-input"]')
      ?.focus();
  }
}
