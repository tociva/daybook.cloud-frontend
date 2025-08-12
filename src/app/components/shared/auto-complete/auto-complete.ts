import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-auto-complete',
  imports: [NgClass],
  templateUrl: './auto-complete.html',
  styleUrl: './auto-complete.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutoComplete),
      multi: true,
    },
  ],
})
export class AutoComplete<T> implements ControlValueAccessor {
  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('listbox', { static: false }) listboxRef?: ElementRef<HTMLElement>;

  // Inputs
  options = input<T[]>([]);
  placeholder = input<string>('Start typing...');
  required = input<boolean>(false);
  inputClass = input<string | string[] | Record<string, boolean>>(
    'flex-1 border-0 border-b bg-transparent text-sm leading-tight pt-0.5 pb-1 px-0 focus:outline-none'
  );
  readonly displayValue = input<(item: T) => string>();

  // Output
  onOptionSelected = output<T>();
  readonly onSearch = output<string>();

  // Internal state
  inputValue = signal<string>('');          // store text, not T
  selectedValue = signal<T | null>(null);
  isOpen = signal<boolean>(false);
  focusedIndex = signal<number>(-1);
  disabled = signal<boolean>(false);
  touched = signal<boolean>(false);

  // ---- Display resolver (no per-call allocation)
  private readonly identity = (x: T) => String(x ?? '');
  private readonly resolvedDisplay = computed<(item: T) => string>(
    () => this.displayValue() ?? this.identity
  );

  findDisplayValue = (item: T): string => this.resolvedDisplay()(item);

  // ---- ControlValueAccessor
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: T | null): void {
    this.selectedValue.set(value);
    const text = value == null ? '' : this.findDisplayValue(value);
    this.inputValue.set(text);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- UI events
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value ?? '';
    this.inputValue.set(val);
  
    // Emit search term to parent
    this.onSearch.emit(val);
  
    // Keep dropdown open and reset focus
    this.openDropdown();
  }

  onInputFocus(): void {
    this.openDropdown();
  }

  onInputBlur(): void {
    // defer; actual close is handled via HostListener to allow option click
    this.touched.set(true);
    this.onTouched();
  }

  onKeyDown(event: KeyboardEvent): void {
    const list = this.options();
    if (!this.isOpen() && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      this.openDropdown();
      event.preventDefault();
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        const next = Math.min(this.focusedIndex() + 1, list.length - 1);
        this.focusedIndex.set(next);
        event.preventDefault();
        this.scrollFocusedIntoView();
        break;
      }
      case 'ArrowUp': {
        const prev = Math.max(this.focusedIndex() - 1, 0);
        this.focusedIndex.set(prev);
        event.preventDefault();
        this.scrollFocusedIntoView();
        break;
      }
      case 'Home': {
        if (list.length) {
          this.focusedIndex.set(0);
          this.scrollFocusedIntoView();
          event.preventDefault();
        }
        break;
      }
      case 'End': {
        if (list.length) {
          this.focusedIndex.set(list.length - 1);
          this.scrollFocusedIntoView();
          event.preventDefault();
        }
        break;
      }
      case 'Enter': {
        const i = this.focusedIndex();
        if (this.isOpen() && i >= 0 && list[i] !== undefined) {
          this.select(list[i]);
          event.preventDefault();
        }
        break;
      }
      case 'Escape': {
        this.closeDropdown();
        event.preventDefault();
        break;
      }
    }
  }

  // Mouse select (use mousedown to beat input blur)
  onOptionMouseDown(item: T, index: number, ev: MouseEvent): void {
    ev.preventDefault();
    this.focusedIndex.set(index);
    this.select(item);
  }

  // ---- Helpers
  private openDropdown(): void {
    this.isOpen.set(true);
    if (this.options().length) {
      // if we already have a selected value, focus that; else 0
      const sel = this.selectedValue();
      const idx = sel != null
        ? this.options().findIndex(o => this.findDisplayValue(o) === this.findDisplayValue(sel))
        : 0;
      this.focusedIndex.set(idx >= 0 ? idx : 0);
    } else {
      this.focusedIndex.set(-1);
    }
  }

  private closeDropdown(): void {
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
  }

  private select(item: T): void {
    this.selectedValue.set(item);
    this.inputValue.set(this.findDisplayValue(item));
    this.onChange(item);
    this.onOptionSelected.emit(item);
    this.closeDropdown();
    // return focus to input for smooth UX
    queueMicrotask(() => this.inputElement?.nativeElement?.focus());
  }

  private scrollFocusedIntoView(): void {
    const listbox = this.listboxRef?.nativeElement;
    if (!listbox) return;
    const i = this.focusedIndex();
    if (i < 0) return;
    const el = listbox.querySelector<HTMLElement>(`[data-index="${i}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }

  // ---- Click outside to close, but allow clicks inside
  constructor(private host: ElementRef<HTMLElement>) {}

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(ev: MouseEvent) {
    const target = ev.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }
}
