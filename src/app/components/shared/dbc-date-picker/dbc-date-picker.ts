import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
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
export class DbcDatePicker {

  selectedDate = signal<Date | null>(null);
  draftDate = signal<Date | null>(null);
  currentMonth = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  showCalendar = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  inputDay = signal('');
  inputMonth = signal('');
  inputYear = signal('');

  format = input<string>('DD/MM/YYYY');

  
   readonly months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  readonly yearOptions = Array.from({ length: 1101 }, (_, i) => 1900 + i);

  yearList = viewChild<ElementRef<HTMLDivElement>>('yearList');

  calendarDays = computed(() =>
    this.getCalendarDays(this.currentYear(), this.currentMonth())
  );

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  private elem = inject(ElementRef);
 private inputEffect = effect(() => {
  const dayStr =Number(this.inputDay());
  const monthStr =Number(this.inputMonth());
  const yearStr = Number(this.inputYear());

this.draftDate.set(null);

if (dayStr) {
    const day = Number(dayStr);
    if (isNaN(day) || day < 1 || day > 31) {
      this.inputDay.set('');
      return;
    }
  }
 if (monthStr) {
    const month = Number(monthStr);
    if (isNaN(month) || month < 1 || month > 12) {
      this.inputMonth.set('');
      return;
    }
  }  
if (yearStr) {
    const year = Number(yearStr);
    if (isNaN(year) || year < 1900 || year > 3000) {
      this.inputYear.set('');
      return;
    }
  }
  if (!dayStr || !monthStr || !yearStr) {
    return;
  }

  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  const date = dayjs(`${day}-${month}-${year}`, 'D-M-YYYY', true);

  if (!date.isValid()) {
    this.resetInputs();
    return;
  }
  this.draftDate.set(date.toDate());
  this.currentMonth.set(date.month());
  this.currentYear.set(date.year());
});

private resetInputs() {
  this.inputDay.set('');
  this.inputMonth.set('');
  this.inputYear.set('');
  this.draftDate.set(null);
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
    const selected = this.selectedDate();
    if (!selected || !day) return false;
    return (
      selected.getDate() === day &&
      selected.getMonth() === this.currentMonth() &&
      selected.getFullYear() === this.currentYear()
    );
  }


  private setSelectedDate(date: Date) {
    this.selectedDate.set(date);
    this.inputDay.set(String(date.getDate()).padStart(2, '0'));
    this.inputMonth.set(String(date.getMonth() + 1).padStart(2, '0'));
    this.inputYear.set(date.getFullYear().toString());
    this.draftDate.set(date);
    this.updateForm(date);
  }

  private syncCalendar(date: Date) {
    this.currentMonth.set(date.getMonth());
    this.currentYear.set(date.getFullYear());
  }

  private updateDraftDate(month: number, year: number) {
    const base = this.draftDate() ?? new Date();
    const maxDay = new Date(year, month + 1, 0).getDate();
    this.draftDate.set(new Date(year, month, Math.min(base.getDate(), maxDay)));
  }

  private getCalendarDays(year: number, month: number): (number | null)[] {
    const firstWeekday = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return [
      ...Array(firstWeekday).fill(null),
      ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
  }

  private updateForm(date: Date) {
    this.onChange(date);
    console.log(date);
    
    this.onTouched();
  }
}
