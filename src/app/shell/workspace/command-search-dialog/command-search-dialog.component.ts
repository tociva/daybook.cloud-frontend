import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TngAutocompleteComponent, TngDialogComponent } from '@tailng-ui/components';
import { SearchEntry, SearchIndexService } from './search-index.service';

@Component({
  selector: 'app-command-search-dialog',
  imports: [TngDialogComponent, TngAutocompleteComponent],
  templateUrl: './command-search-dialog.component.html',
  styleUrl: './command-search-dialog.component.css',
})
export class CommandSearchDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() initialValue = '';
  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild(TngAutocompleteComponent, { read: ElementRef })
  private readonly autocompleteEl!: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private readonly searchIndex = toSignal(inject(SearchIndexService).index$);

  protected readonly query = signal('');

  protected readonly filteredItems = computed((): readonly SearchEntry[] => {
    const index = this.searchIndex();
    if (!index) return [];

    const q = this.query().trim();
    if (!q) return index.entries;

    return index.fuse.search(q).map((r) => r.item);
  });

  protected readonly getItemValue = (item: SearchEntry): string => item.url;
  protected readonly getItemLabel = (item: SearchEntry): string => item.title;
  protected readonly trackItem = (_: number, item: SearchEntry): string => item.url;

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (openChange?.currentValue === true) {
      this.query.set(this.initialValue);
      setTimeout(() => {
        const input = this.autocompleteEl?.nativeElement?.querySelector('input');
        input?.focus();
      }, 0);
    }
  }

  protected onValueChange(url: string | null): void {
    if (!url) return;
    void this.router.navigateByUrl(url);
    this.openChange.emit(false);
  }

  protected onDialogClosed(): void {
    this.query.set('');
    this.closed.emit();
  }

  protected onDialogOpenChange(next: boolean): void {
    this.openChange.emit(next);
  }
}
