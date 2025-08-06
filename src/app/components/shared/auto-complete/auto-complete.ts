import { Component, computed, input, model, output, Signal } from '@angular/core';
import { FormField } from '../../../../util/types/form-field.model';

@Component({
  selector: 'app-auto-complete',
  templateUrl: './auto-complete.html',
  standalone: true,
  styleUrl: './auto-complete.css',
})
export class AutoComplete<T> {
  
  readonly items = input<T[]>();

  readonly onSearch = output<string>();

  readonly displayValue = input<(item: T) => string>();

  readonly trackBy = input<(item: T) => string>();

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
}
