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

  readonly onSearch = output<string>();

  readonly onSelect = output<T>();

  readonly displayValue = input<(item: T) => string>();

  readonly trackBy = input<(item: T) => string>();

  readonly showDropdown = signal(false);

  readonly activeIndex = signal(0);

  readonly selectedDisplayValue = signal('');


  constructor(private injector: EnvironmentInjector) {
    document.addEventListener('click', this.handleOutsideClick);
    queueMicrotask(() => {
      this.setupScrollEffect();
    });
  }

  private setupScrollEffect() {
    this.injector.runInContext(() => {
      effect(() => {
        const el = this.optionElements?.get(this.activeIndex());
        el?.nativeElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      });
    });
  }
  
  handleOutsideClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const root = document.querySelector('app-auto-complete');
  
    if (root && !root.contains(target)) {
      this.showDropdown.set(false);
    }
  };
  
  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleOutsideClick);
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
  
}
