import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Input,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

@Component({
  selector: 'app-dbc-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dbc-date-picker.html',
  styleUrls: ['./dbc-date-picker.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbcDatePicker),
      multi: true,
    },
  ],
})
export class DbcDatePicker implements ControlValueAccessor {

  selectedDate = signal<Date | null>(null);
  draftDate = signal<Date | null>(null);
  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  showCalendar = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  dayValue = signal('');
  monthValue = signal('');
  yearValue = signal('');

  format = input<string>('DD/MM/YYYY');

  dayPlaceholderText = computed(() => 'DD');
  yearPlaceholderText = computed(() => 'YYYY');
  monthPlaceholderText = computed(() => {
    const f = this.format();
    if (f.includes('MMM')) return 'MMM';
    if (f.includes('MMMM')) return 'MMMM';
    return 'MM';
  });


  readonly months = [
    'Jan', 'Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
  ];

  readonly yearOptions = Array.from({ length: 1101 }, (_, i) => 1900 + i);

  yearList = viewChild<ElementRef<HTMLDivElement>>('yearList');

  calendarDays = computed(() => this.getCalendarDays(this.currentYear(), this.currentMonth()));

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  private elem = inject(ElementRef);
  private inputEffect = effect(() => {
    const day = Number(this.dayValue());
    const monthIndex = this.parseMonthToIndex(this.monthValue());
    const year = Number(this.yearValue());

    this.draftDate.set(null);

    if (day) {
      if (isNaN(day) || day < 1 || day > 31) {
        this.dayValue.set('');
        return;
      }
    }
    if (this.monthValue() && monthIndex === null) {
      this.monthValue.set('');
      return;
    }
    if (year) {
      const yearstr = Number(year);

      if (isNaN(yearstr) || yearstr < 1900 || yearstr > 3000) {
        this.yearValue.set('');
        return;
      }
    }

    if (!day || monthIndex === null || !year) return;

    const date = new Date(year, monthIndex, day);

    if (date.getDate() !== day && date.getFullYear()! == year ) {
      this.resetDateInputs();
      return;
    }
    this.selectedDate.set(date);
    this.draftDate.set(date);
    this.currentMonth.set(monthIndex);
    this.currentYear.set(year);
  });

  // get dateSeparator(): string {
  //   const match = this.format().match(/[^A-Za-z0-9]/);
  //   return match ? match[0] : '/';
  // }
  formatParts = computed(()=>
    this.format().match(/[A-Za-z]+|[^A-Za-z]/g) ?? []
  );

  private resetDateInputs() {
    this.dayValue.set('');
    this.monthValue.set('');
    this.yearValue.set('');
    this.draftDate.set(null);
  }

  monthMaxLength = computed(() => {
  const f = this.format();
  if (f.includes('MMM')) return 3;
  return 2;                        
});


  private parseMonthToIndex(value: string): number | null {
    if (!value) return null;

    const lower = value.toLowerCase();
    if (/^\d+$/.test(lower)) {
      const num = Number(lower);
      return num >= 1 && num <= 12 ? num - 1 : null;
    }
    const index = this.months.map((m) => m.toLowerCase()).findIndex((m) => m.startsWith(lower));

    return index !== -1 ? index : null;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    if (!this.elem.nativeElement.contains(event.target)) {
      this.showCalendar.set(false);
    }
  }

  toggleCalendar() {
    if (!this.isDisabled()) {
      this.showCalendar.set(!this.showCalendar());
    }
  }

  cancel() {
    this.showCalendar.set(false);
  }

  confirm() {
    const date = this.draftDate();
    if (date) this.setSelectedDate(date);
    this.showCalendar.set(false);
  }

  selectToday() {
    const today = new Date();
    this.setSelectedDate(today);
    this.syncCalendar(today);
    this.showCalendar.set(false);
  }

  pickDay(day: number | null) {
    if (!day) return;
    const date = new Date(this.currentYear(), this.currentMonth(), day);
    this.setSelectedDate(date);
    this.showCalendar.set(false);
  }

  pickMonth(monthIndex: number) {
    this.currentMonth.set(monthIndex);
    this.updateDraftDate(monthIndex, this.currentYear());
  }

  pickYear(year: number) {
    this.currentYear.set(year);
    this.updateDraftDate(this.currentMonth(), year);
  }

  writeValue(value: Date | string | null): void {
    if (!value) return;
    const date = value instanceof Date ? value : this.parseFormattedDate(value);
    if (!date) return;
    this.setSelectedDate(date);
    this.syncCalendar(date);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.isDisabled.set(disabled);
  }

  scrollYearList(px: number) {
    this.yearList()?.nativeElement.scrollBy({ top: px, behavior: 'smooth' });
  }

  formatDate(date: Date): string {
    return dayjs(date).format(this.format());
  }

  parseFormattedDate(value: string): Date | null {
    const parsed = dayjs(value, this.format(), true);
    return parsed.isValid() ? parsed.toDate() : null;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      this.currentMonth() === today.getMonth() &&
      this.currentYear() === today.getFullYear()
    );
  }

  isSelected(day: number | null): boolean {
    const draftDate = this.draftDate();
    if (!draftDate || !day) return false;
    return (
      draftDate.getDate() === day &&
      draftDate.getMonth() === this.currentMonth() &&
      draftDate.getFullYear() === this.currentYear()
    );
  }

  private setSelectedDate(date: Date) {
    this.selectedDate.set(date);

    const d = dayjs(date);
    const parts = d.format(this.format()).match(/[A-Za-z]+|\d+/g) ?? [];

    const formatParts = this.format().match(/[A-Za-z]+/g) ?? [];

    formatParts.forEach((token, i) => {
      if (token.startsWith('D')) this.dayValue.set(parts[i]);
      if (token.startsWith('M')) this.monthValue.set(parts[i]);
      if (token.startsWith('Y')) this.yearValue.set(parts[i]);
    });

    this.draftDate.set(date);
    this.emitValueChange(date);
  }

  private syncCalendar(date: Date) {
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
  }

  private updateDraftDate(month: number, year: number) {
    const selected = this.selectedDate();
    const day = selected?.getDate() ?? 1;
    const maxDay = new Date(year, month + 1, 0).getDate();
    this.draftDate.set(new Date(year, month, Math.min(day, maxDay)));
  }

  private getCalendarDays(year: number, month: number): (number | null)[] {
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return [...Array(firstWeekday).fill(null), ...Array.from({ length: lastDay }, (_, i) => i + 1)];
  }

  private emitValueChange(date: Date) {
    this.onChange(date);
    this.onTouched();
  }
}
