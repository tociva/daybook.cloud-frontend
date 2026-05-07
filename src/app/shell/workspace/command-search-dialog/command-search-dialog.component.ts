import {
  afterNextRender,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
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
export class CommandSearchDialogComponent {
  readonly open = input(false);
  readonly initialValue = input('');
  readonly openChange = output<boolean>();
  readonly closed = output<void>();

  private readonly autocompleteEl = viewChild(TngAutocompleteComponent, { read: ElementRef });

  private readonly router = inject(Router);
  private readonly searchIndex = toSignal(inject(SearchIndexService).index$);

  protected readonly query = signal('');
  private readonly syncOpenState = effect(() => {
    if (!this.open()) {
      return;
    }

    this.query.set(this.initialValue());
    afterNextRender(() => {
      const input = this.autocompleteEl()?.nativeElement?.querySelector('input');
      input?.focus();
    });
  });

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
