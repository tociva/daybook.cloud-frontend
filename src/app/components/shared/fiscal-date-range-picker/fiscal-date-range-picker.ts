import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import objectSupport from 'dayjs/plugin/objectSupport';
import { NgIconComponent } from '@ng-icons/core';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../util/constants';

dayjs.extend(objectSupport);
dayjs.extend(customParseFormat);

const DISPLAY_FORMAT = 'MMMM-DD-YYYY' as const;

@Component({
  selector: 'app-fiscal-date-range-picker',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  templateUrl: './fiscal-date-range-picker.html',
  styleUrls: ['./fiscal-date-range-picker.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FiscalDateRangePicker,
      multi: true,
    },
  ],
})
export class FiscalDateRangePicker implements ControlValueAccessor {
  private readonly hostEl = inject(ElementRef<HTMLElement>);

  /** ---------- Inputs ---------- */
  required = input<boolean>(false);
  dateFormat = input<string>('YYYY-MM-DD');
  inputClass = input<string>(
    'flex-1 border-0 border-b bg-transparent text-sm leading-tight pt-0.5 pb-1 px-0 focus:outline-none'
  );
  minYear = input<number | null>(null);
  maxYear = input<number | null>(null);

  /** ---------- Internal State ---------- */
  private readonly _disabled = signal(false);
  protected readonly open = signal(false);
  protected readonly suppressNextOpen = signal(false);
  protected readonly year = signal<number>(new Date().getFullYear());

  /** Seeded from incoming value (or defaults to Jan 1 of current year) */
  private readonly seedMonth = signal<number>(0); // 0–11
  private readonly seedDay = signal<number>(1);   // 1–31

  /** Template refs */
  protected readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('fiscalDateRangePickerInput');
  private _yearPanel?: ElementRef<HTMLDivElement>;

  @ViewChild('yearPanel', { static: false })
  set yearPanelRef(el: ElementRef<HTMLDivElement> | undefined) {
    this._yearPanel = el;
    if (el) queueMicrotask(() => this.scrollSelectedIntoView());
  }

  /** ---------- Derived ---------- */
  protected readonly years = computed<number[]>(() => {
    const min = this.minYear() ?? 1900;
    const max = this.maxYear() ?? 2300;
    if (max >= min) {
      const arr: number[] = [];
      for (let y = min; y <= max; y++) arr.push(y);
      return arr;
    }
    return [];
  });

  protected readonly startDate = computed<string>(() => {
    const safe = this.#makeSafeDate(this.year(), this.seedMonth(), this.seedDay());
    return safe.format(DEFAULT_NODE_DATE_FORMAT);
  });

  /** Force 1-year range (inclusive style) */
  protected readonly endDate = computed<string>(() => {
    const start = dayjs(this.startDate());
    return start.add(1, 'year').subtract(1, 'day').format(DEFAULT_NODE_DATE_FORMAT);
  });

  protected readonly displayDate = computed<string>(() =>
    `${dayjs(this.startDate()).format(DISPLAY_FORMAT)} to ${dayjs(this.endDate()).format(DISPLAY_FORMAT)}`
  );

  protected readonly value = computed<[string, string]>(() => [
    this.startDate(),
    this.endDate(),
  ]);

  /** ---------- CVA ---------- */
  private _onChange: (val: [string, string] | null) => void = () => {};
  private _onTouched: () => void = () => {};

  private readonly _propagate = effect(() => {
    if (!this._disabled()) this._onChange(this.value());
  });

  constructor() {
    this.#initFromDefaultCurrentYear();
    effect(() => {
      const isOpen = this.open();
      const _selected = this.year();
      if (isOpen) queueMicrotask(() => this.scrollSelectedIntoView());
    });
  }

  get disabled(): boolean {
    return this._disabled();
  }

  protected togglePopup(): void {
    this.open() ? this.closePopup() : this.openPopup();
  }

  protected openPopup(): void {
    if (this.suppressNextOpen()) {
      this.suppressNextOpen.set(false);
      return;
    }
    this.open.set(true);
  }

  protected closePopup(reason?: 'select' | 'escape' | 'outside' | 'done'): void {
    if (!this.open()) return;
    this.open.set(false);
    if (reason === 'select') this.suppressNextOpen.set(true);
    this._onTouched?.();
  }

  protected changeYear(val: string | number | null | undefined): void {
    if (this._disabled()) return;
    const parsed = this.#toNumber(val);
    if (!Number.isFinite(parsed)) return;

    const clamped = this.#clampYear(Math.trunc(parsed));
    if (clamped != null) {
      this.year.set(clamped);
      this._onTouched();
    }
  }

  protected onKeyDownInput(e: KeyboardEvent): void {
    if (this._disabled()) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.togglePopup();
      return;
    }
    if (!this.open()) return;

    const step = (n: number) => this.changeYear(this.year() + n);

    switch (e.key) {
      case 'ArrowUp':   e.preventDefault(); step(-5);  break;
      case 'ArrowLeft': e.preventDefault(); step(-1);  break;
      case 'ArrowDown': e.preventDefault(); step(5); break;
      case 'ArrowRight':e.preventDefault(); step(1); break;
      case 'PageUp':    e.preventDefault(); step(10); break;
      case 'PageDown':  e.preventDefault(); step(-10);  break;
      case 'Home':
        e.preventDefault();
        if (this.minYear() != null) this.changeYear(this.minYear()!);
        break;
      case 'End':
        e.preventDefault();
        if (this.maxYear() != null) this.changeYear(this.maxYear()!);
        break;
      case 'Escape':
        e.preventDefault();
        this.closePopup('escape');
        break;
    }
  }

  protected onKeyDownPopup(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closePopup('escape');
      this.inputEl().nativeElement.focus();
    }
  }

  protected selectYear(y: number): void {
    if (this._disabled()) return;
    this.changeYear(y);
    this.closePopup('select');
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(ev: MouseEvent): void {
    if (!this.open()) return;
    const target = ev.target as Node;
    const host = this.hostEl.nativeElement;
    if (host && !host.contains(target)) this.closePopup('outside');
  }

  /** --- CVA --- */
  writeValue(obj: [string, string] | null): void {
    if (!obj || !Array.isArray(obj) || obj.length !== 2) {
      this.#initFromDefaultCurrentYear();
      return;
    }

    const [start /* , endIgnored */] = obj;
    const dStart = dayjs(start);

    if (!dStart.isValid()) {
      this.#initFromDefaultCurrentYear();
      return;
    }

    // Seed ONLY from incoming start; end is derived as +1y - 1d
    this.year.set(dStart.year());
    this.seedMonth.set(dStart.month()); // 0–11
    this.seedDay.set(dStart.date());    // 1–31
  }

  registerOnChange(fn: (val: [string, string] | null) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  /** ---------- Private ---------- */
  private scrollSelectedIntoView(): void {
    const panel = this._yearPanel?.nativeElement;
    if (!panel) return;
    const selected = panel.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /** Default to current calendar year [Jan 1 .. Dec 31] */
  #initFromDefaultCurrentYear(): void {
    const y = dayjs().year();
    this.year.set(y);
    this.seedMonth.set(0); // Jan
    this.seedDay.set(1);   // 1
  }

  /** Create a valid date for (year, monthIndex, day), clamp to end-of-month if invalid (e.g., Feb 29). */
  #makeSafeDate(year: number, monthIndex: number, day: number): Dayjs {
    let d = dayjs({ year, month: monthIndex, day });
    if (!d.isValid() || d.month() !== monthIndex) {
      d = dayjs({ year, month: monthIndex, day: 1 }).endOf('month');
    }
    return d;
  }

  #toNumber(val: string | number | null | undefined): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && val.trim() !== '') return +val;
    return NaN;
  }

  #clampYear(y: number): number | null {
    const min = this.minYear();
    const max = this.maxYear();
    if (min != null && y < min) return min;
    if (max != null && y > max) return max;
    return y;
  }
}
