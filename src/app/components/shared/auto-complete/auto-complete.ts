import { NgClass } from '@angular/common';
import { Component, effect, ElementRef, EnvironmentInjector, input, output, QueryList, signal, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-auto-complete',
  templateUrl: './auto-complete.html',
  standalone: true,
  styleUrl: './auto-complete.css',
  imports: [NgClass],
})
export class AutoComplete<T> {

  @ViewChildren('optionRef') optionElements!: QueryList<ElementRef<HTMLElement>>;

  readonly inputClass = input<string | string[] | Record<string, boolean>>('flex-1 border-0 border-b bg-transparent text-sm leading-tight pt-0.5 pb-1 px-0 focus:outline-none focus:border-b-primary border-b-gray-300');

  readonly items = input<T[]>();

  readonly value = input<T | null>();

  readonly onSearch = output<string>();

  readonly onSelect = output<T>();

  readonly displayValue = input<(item: T) => string>();

  readonly trackBy = input<(item: T) => string>();

  readonly showDropdown = signal(false);

  readonly activeIndex = signal(0);

  readonly selectedDisplayValue = signal('');


  constructor(private injector: EnvironmentInjector) {
    queueMicrotask(() => {
      this.setupScrollEffect();
      this.setInitialValue();
    });
  }

  private setInitialValue() {
    effect(() => {
      const val = this.value();
      if (val) {
        this.selectedDisplayValue.set(this.findDisplayValue(val));
        this.onSearch.emit(this.findDisplayValue(val));
      }
    }, { injector: this.injector });
    
  }
  
  private setupScrollEffect() {
    effect(() => {
      const el = this.optionElements?.get(this.activeIndex());
      el?.nativeElement.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }, { injector: this.injector });
  }
  

  findTrackBy(item: T): string {
    const trackBy = this.trackBy();
    if(!trackBy) {
      return item as unknown as string;
    }
    return trackBy(item);
  }

  findDisplayValue(item: T): string {
    const displayValue = this.displayValue();
    if(!displayValue) {
      return item as unknown as string;
    }
    
    return displayValue(item);
  }

  handleInput(value: string) {
    this.onSearch.emit(value);
    this.activeIndex.set(0);
    this.showDropdown.set(true);
    this.selectedDisplayValue.set(value);
  }

  onFocus() {
    this.activeIndex.set(0);
    this.showDropdown.set(true);
  }

  handleItemSelect(item: T): void {
    const value = this.findDisplayValue(item);
    this.selectedDisplayValue.set(value);
    this.onSearch.emit(value);
    this.showDropdown.set(false);
    this.onSelect.emit(item);
  }
  

  handleKeyDown(event: KeyboardEvent): void {
    const isOpen = this.showDropdown();
    const count = this.items()?.length ?? 0;
  
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      const input = event.target as HTMLInputElement;
      this.onSearch.emit(input?.value ?? '');
      this.showDropdown.set(false);
      return;
    }
  
    if (event.key === 'ArrowDown' && isOpen) {
      event.preventDefault();
      const next = Math.min(this.activeIndex() + 1, count - 1);
      this.activeIndex.set(next);
      return;
    }
  
    if (event.key === 'ArrowUp' && isOpen) {
      event.preventDefault();
      const prev = Math.max(this.activeIndex() - 1, 0);
      this.activeIndex.set(prev);
      return;
    }
  
    if (event.key === 'Enter' && isOpen) {
      event.preventDefault();
      const selected = this.items()?.[this.activeIndex()];
      if (selected) {
        this.handleItemSelect(selected);
      }
      return;
    }
  }

  handleOnBlur() {
    const selected = this.items()?.[this.activeIndex()];
      if (selected) {
        this.handleItemSelect(selected);
      }
    this.showDropdown.set(false);
  }
  
}
