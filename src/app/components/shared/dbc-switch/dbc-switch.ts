import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  forwardRef,
  input,
  signal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'dbc-switch',
  standalone: true,
  imports: [],
  templateUrl: './dbc-switch.html',
  styleUrl: './dbc-switch.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbcSwitch),
      multi: true,
    },
  ],
})
export class DbcSwitch implements ControlValueAccessor {
  // API
  id = input<string | null>(null);
  label = input<string>('');
  disabled = signal(false);
  size = input<'sm' | 'md' | 'lg'>('md');

  // Internal
  private _value = signal(false);
  protected focused = signal(false);

  protected isOn = computed(() => this._value());
  protected thumbClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-3 w-3 translate-x-0.5 peer-checked:translate-x-3.5';
      case 'lg': return 'h-5 w-5 translate-x-0.5 peer-checked:translate-x-6.5';
      default:   return 'h-4 w-4 translate-x-0.5 peer-checked:translate-x-5';
    }
  });
  protected trackClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-4 w-7';
      case 'lg': return 'h-7 w-14';
      default:   return 'h-5 w-9';
    }
  });

  constructor(private el: ElementRef<HTMLElement>) {
    effect(() => this._onChange?.(this._value()));
  }

  // CVA plumbing
  private _onChange: (val: boolean) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this._value.set(!!value);
  }
  registerOnChange(fn: (val: boolean) => void): void {
    this._onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // Behavior
  protected toggle() {
    if (this.disabled()) return;
    this._value.set(!this._value());
    this._onTouched?.();
  }
  protected onKeyDown(e: KeyboardEvent) {
    if (this.disabled()) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
    }
  }
  protected onFocus() { this.focused.set(true); }
  protected onBlur() { this.focused.set(false); this._onTouched?.(); }

  @HostListener('mousedown', ['$event'])
  preventBlur(ev: MouseEvent) {
    if ((ev.target as HTMLElement).closest('button[data-switch]')) return;
  }

  protected thumbSizeClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-3 w-3';
      case 'lg': return 'h-5 w-5';
      default:   return 'h-4 w-4';
    }
  });
  
  /** How far the thumb should slide when ON */
  protected thumbTranslateClass = computed(() => {
    const on = this.isOn();
    switch (this.size()) {
      // Track w-7 (28px), thumb 12px, pad 2px => move 12px → translate-x-3
      case 'sm': return on ? 'translate-x-3' : 'translate-x-0';
      // Track w-14 (56px), thumb 20px, pad 2px => move 32px → translate-x-8
      case 'lg': return on ? 'translate-x-8' : 'translate-x-0';
      // Track w-9 (36px), thumb 16px, pad 2px => move 16px → translate-x-4
      default:   return on ? 'translate-x-4' : 'translate-x-0';
    }
  });
  
}

