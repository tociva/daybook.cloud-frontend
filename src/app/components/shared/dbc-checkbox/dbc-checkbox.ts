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

/**
 * Value can be boolean or 'mixed' when tristate=true
 */
export type CheckboxValue = boolean | 'mixed';

@Component({
  selector: 'dbc-checkbox',
  standalone: true,
  imports: [NgIconComponent],
  templateUrl: './dbc-checkbox.html',
  styleUrl: './dbc-checkbox.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DbcCheckbox),
      multi: true,
    },
  ],
})
export class DbcCheckbox implements ControlValueAccessor {
  // ---- API (signals-based) ----
  id = input<string | null>(null);
  label = input<string>('');
  hint = input<string>('');
  disabled = signal(false);

  /** 'sm' | 'md' | 'lg' */
  size = input<'sm' | 'md' | 'lg'>('md');

  /** 'primary' | 'neutral' */
  variant = input<'primary' | 'neutral'>('primary');

  /** Allow indeterminate 'mixed' state and cycle: mixed -> true -> false -> mixed */
  tristate = input<boolean>(false);

  /** Extra classes for the clickable container (not the label text) */
  boxClass = input<string>('');

  /** Extra classes for label text */
  labelClass = input<string>('');

  // ---- Internal state ----
  private _value = signal<CheckboxValue>(false);
  protected focused = signal(false);
  protected hostEl = this.el.nativeElement as HTMLElement;

  protected ariaChecked = computed(() => {
    const v = this._value();
    return v === 'mixed' ? 'mixed' : String(!!v);
  });

  protected isChecked = computed(() => this._value() === true);
  protected isMixed = computed(() => this._value() === 'mixed');

  protected boxSizeClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'h-4 w-4 text-xs';
      case 'lg': return 'h-6 w-6 text-base';
      default:   return 'h-5 w-5 text-sm';
    }
  });

  protected labelSizeClass = computed(() => {
    switch (this.size()) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-base';
      default:   return 'text-sm';
    }
  });

  protected colorClasses = computed(() => {
    const isDisabled = this.disabled();
    const checkedOrMixed = this.isChecked() || this.isMixed();
    const v = this.variant();

    if (isDisabled) {
      return checkedOrMixed
        ? 'bg-gray-300 border-gray-300 text-white'
        : 'bg-white border-gray-300';
    }

    if (checkedOrMixed) {
      // use your Tailwind theme tokens
      return v === 'neutral'
        ? 'bg-gray-900 border-gray-900 text-white'
        : 'bg-primary border-primary text-white';
    }
    return 'bg-white border-gray-400';
  });

  protected ringClasses = computed(() =>
    this.focused() && !this.disabled()
      ? 'ring-2 ring-offset-2 ring-primary/40'
      : 'ring-0'
  );

  // template ref for focusing
  protected buttonEl = viewChild.required<ElementRef<HTMLButtonElement>>('btn');

  constructor(private el: ElementRef<HTMLElement>) {
    // propagate on change
    effect(() => {
      const v = this._value();
      this._onChange?.(v);
    });
  }

  // ---- ControlValueAccessor ----
  private _onChange: (val: CheckboxValue) => void = () => {};
  private _onTouched: () => void = () => {};

  writeValue(value: CheckboxValue): void {
    // normalize if tristate=false
    if (!this.tristate()) {
      this._value.set(value === true);
    } else {
      this._value.set(value === 'mixed' ? 'mixed' : !!value);
    }
  }

  registerOnChange(fn: (val: CheckboxValue) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- Behavior ----
  protected toggle() {
    if (this.disabled()) return;
    const tri = this.tristate();
    const current = this._value();

    if (tri) {
      // mixed -> true -> false -> mixed
      const next =
        current === 'mixed' ? true :
        current === true    ? false :
                              'mixed';
      this._value.set(next);
    } else {
      this._value.set(current === true ? false : true);
    }
  }

  protected onClick() {
    this.toggle();
    this._onTouched?.();
  }

  protected onKeyDown(e: KeyboardEvent) {
    if (this.disabled()) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      this.toggle();
      this._onTouched?.();
    }
  }

  protected onFocus() {
    this.focused.set(true);
  }
  protected onBlur() {
    this.focused.set(false);
    this._onTouched?.();
  }

  // Close label click from selecting text outside
  @HostListener('mousedown', ['$event'])
  preventFocusLoss(ev: MouseEvent) {
    // keep the button focus consistent
    if ((ev.target as HTMLElement).closest('button[data-checkbox]')) return;
  }
}
