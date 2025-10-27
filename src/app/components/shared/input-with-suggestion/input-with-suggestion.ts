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
import { NgIconComponent } from '@ng-icons/core';

@Component({
  selector: 'app-input-with-suggestion',
  imports: [NgClass, NgIconComponent],
  templateUrl: './input-with-suggestion.html',
  styleUrl: './input-with-suggestion.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputWithSuggestion),
      multi: true,
    },
  ],
})
export class InputWithSuggestion<T extends string | number> implements ControlValueAccessor {
  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef<HTMLInputElement>;
  @ViewChild('listbox', { static: false }) listboxRef?: ElementRef<HTMLElement>;

  // Inputs
  options = input<T[]>([]);
  placeholder = input<string>('Start typing...');
  required = input<boolean>(false);
  inputClass = input<string>(
    'flex-1 border-0 border-b bg-transparent text-sm leading-tight pt-0.5 pb-1 px-0 focus:outline-none'
  );
  readonly hideIcon = input<boolean>(false);
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

  // ControlValueAccessor
  private onChange: (value: T | null) => void = () => {};
  private onTouched: () => void = () => {};

  private commitFreeTextIfAny(): void {
    const raw = this.inputValue().trim();
  
    // If empty, treat as null clear
    if (raw === '') {
      this.selectedValue.set(null);
      this.onChange(null);
      return;
    }
  
    // If the typed text exactly matches an existing option, prefer selecting it
    const match = this.options().find(o => String(o) === raw);
    if (match !== undefined) {
      this.select(match);
      return;
    }
  
    // Otherwise parse and commit as free text
    this.selectedValue.set(raw as T);
    this.onChange(raw as T);
    // DO NOT emit onOptionSelected here (it was not chosen from the list)
  }
  

  writeValue(value: T | null | undefined): void {
    if (value == null) {
      this.selectedValue.set(null);
      this.inputValue.set('');
      return;
    }
    this.selectedValue.set(value);
    this.inputValue.set(String(value));
  }
  
  registerOnChange(fn: (value: T | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // ---- UI events
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.inputValue.set(val);
    // Emit search term to parent
    this.onSearch.emit(val);
  
    // Keep dropdown open and reset focus
    this.openDropdown();
  }

  onInputFocus(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.inputValue.set(val);
    // Emit search term to parent
    this.onSearch.emit('');
    this.openDropdown();
  }

  onInputBlur(event: FocusEvent): void {
    // defer; actual close is handled via HostListener to allow option click
    this.touched.set(true);
    this.onTouched();

    const next = event.relatedTarget as Node | null;
    const stayingInside = !!next && this.host.nativeElement.contains(next);

    // Close only if focus moved outside (TAB / SHIFT+TAB, or clicking elsewhere)
    if (!stayingInside) {
      this.commitFreeTextIfAny();
      this.closeDropdown();
    }
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
        }else {
          this.commitFreeTextIfAny();
          this.closeDropdown();
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
        ? this.options().findIndex(o => o === sel)
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
    this.inputValue.set(String(item));
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
  // 2) (Optional but robust) also listen for focusout on the host to catch any edge cases
  @HostListener('focusout', ['$event'])
  onHostFocusOut(ev: FocusEvent) {
    // If focus is leaving the whole component, close the dropdown.
    const next = ev.relatedTarget as Node | null;
    if (!next || !this.host.nativeElement.contains(next)) {
      this.closeDropdown();
    }
  }

  showOptions(event: Event): void {
    event.preventDefault();
    this.onSearch.emit('');
    this.openDropdown();
    // Keep focus in the input for typing
    queueMicrotask(() => this.inputElement?.nativeElement?.focus());
  }
  

}
