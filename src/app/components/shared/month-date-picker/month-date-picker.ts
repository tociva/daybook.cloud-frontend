import { NgClass } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';

type MonthInfo = { name: string; max: number };

const MONTHS: MonthInfo[] = [
  { name: 'January',   max: 31 },
  { name: 'February',  max: 29 }, // allow 29 since we don't track year
  { name: 'March',     max: 31 },
  { name: 'April',     max: 30 },
  { name: 'May',       max: 31 },
  { name: 'June',      max: 30 },
  { name: 'July',      max: 31 },
  { name: 'August',    max: 31 },
  { name: 'September', max: 30 },
  { name: 'October',   max: 31 },
  { name: 'November',  max: 30 },
  { name: 'December',  max: 31 },
];

@Component({
  selector: 'app-month-date-picker',
  imports: [NgClass, NgIconComponent],
  templateUrl: './month-date-picker.html',
  styleUrl: './month-date-picker.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonthDatePicker),
      multi: true,
    },
  ],
})
export class MonthDatePicker implements ControlValueAccessor {
  inputClass = input<string>(
    'flex-1 border-0 border-b bg-transparent text-sm leading-tight pt-0.5 pb-1 px-0 focus:outline-none'
  );

  protected monthIndex = signal<number | null>(null);
  protected day = signal<number | null>(null);
  protected disabled = signal(false);

  protected open = signal(false);
  protected hovering = signal<HTMLElement | null>(null);

  // template refs
  protected inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputElement');
  protected popupEl = viewChild<ElementRef<HTMLDivElement>>('popup');

  protected months = MONTHS;

  protected maxDayForMonth = computed(() => {
    const idx = this.monthIndex();
    return idx == null ? 31 : this.months[idx].max;
  });

  protected daysArray = computed(() =>
    Array.from({ length: this.maxDayForMonth() }, (_, i) => i + 1)
  );

  protected valueString = computed<string | null>(() => {
    const m = this.monthIndex();
    const d = this.day();
    if (m == null || d == null) return null;
    const dayStr = String(d).padStart(2, '0');
    return `${this.months[m].name}-${dayStr}`;
  });

  protected preview = computed(() => this.valueString() ?? '');

  protected suppressNextOpen = signal(false);


  constructor(private host: ElementRef<HTMLElement>) {
    effect(() => {
      const v = this.valueString();
      this._onChange?.(v);
    });
  }

  // --- CVA plumbing ---
  private _onChange: (val: string | null) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    if (!value) {
      this.monthIndex.set(null);
      this.day.set(null);
      return;
    }
    const [monthName, dayStr] = value.split('-');
    const idx = this.months.findIndex((m) => m.name === monthName);
    const d = Number(dayStr);
    if (idx >= 0 && Number.isFinite(d)) {
      this.monthIndex.set(idx);
      const max = this.months[idx].max;
      this.day.set(Math.min(Math.max(d, 1), max));
    } else {
      this.monthIndex.set(null);
      this.day.set(null);
    }
  }

  registerOnChange(fn: (val: string | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // --- open/close ---
protected openPopup() {
  if (this.disabled()) return;
  if (this.suppressNextOpen()) {
    this.suppressNextOpen.set(false); // consume the guard
    return;
  }
  this.open.set(true);
  if (this.monthIndex() == null) this.monthIndex.set(0);
  queueMicrotask(() => this.popupEl()?.nativeElement?.focus());
}
protected closePopup(reason?: 'select' | 'escape' | 'outside' | 'done') {
  if (!this.open()) return;
  this.open.set(false);
  if (reason === 'select') this.suppressNextOpen.set(true);
  this._onTouched?.();
}

  // Close when clicking outside
  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    if (!this.open()) return;
    const target = ev.target as Node;
    const root = this.host.nativeElement;
    if (!root.contains(target)) this.closePopup();
  }

  // --- handlers ---
  protected onMonthClick(idx: number) {
    this.monthIndex.set(idx);
    // clamp existing day, if any
    const d = this.day();
    if (d != null && d > this.maxDayForMonth()) this.day.set(this.maxDayForMonth());
  }

  protected onDayClick(d: number) {
    this.day.set(d);
    this.closePopup('select');
    this.inputEl().nativeElement.focus(); // safe now, focus won't reopen
  }

  protected onKeyDownInput(e: KeyboardEvent) {
    if (this.disabled()) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openPopup();
    }
  }

  protected onKeyDownPopup(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closePopup();
      this.inputEl().nativeElement.focus();
      return;
    }
    // Arrow navigation on days grid
    const m = this.monthIndex();
    if (m == null) return;

    const current = this.day() ?? 1;
    const max = this.maxDayForMonth();

    const step = (delta: number) => {
      let next = current + delta;
      next = Math.min(Math.max(next, 1), max);
      this.day.set(next);
    };

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault(); step(-1); break;
      case 'ArrowRight':
        e.preventDefault(); step(+1); break;
      case 'ArrowUp':
        e.preventDefault(); step(-7); break;
      case 'ArrowDown':
        e.preventDefault(); step(+7); break;
      case 'Enter':
        e.preventDefault();
        // if day not set yet, set current; close
        if (this.day() == null) this.day.set(current);
        this.closePopup();
        this.inputEl().nativeElement.focus();
        break;
    }
  }

  protected touch() {
    this._onTouched();
  }

  protected isInvalidDay = computed(() => {
    const d = this.day();
    if (d == null) return false;
    return d < 1 || d > this.maxDayForMonth();
  });
}
