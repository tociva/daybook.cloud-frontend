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
import { Router } from '@angular/router';
import { TngAutocompleteComponent, TngDialogComponent } from '@tailng-ui/components';
import { workspaceSidebarMenu } from '../../workspace-nav.model';

type SearchItem = {
  label: string;
  groupLabel: string;
  path: string;
};

const allSearchItems: readonly SearchItem[] = workspaceSidebarMenu.flatMap((group) =>
  (group.children ?? []).map((child) => ({
    label: child.name,
    groupLabel: group.name,
    path: child.path.startsWith('/') ? child.path : `/app/${group.path}/${child.path}`,
  })),
);

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

  protected readonly query = signal('');

  protected readonly filteredItems = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return allSearchItems;
    return allSearchItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.groupLabel.toLowerCase().includes(q),
    );
  });

  protected readonly getItemValue = (item: SearchItem): string => item.path;
  protected readonly getItemLabel = (item: SearchItem): string => item.label;
  protected readonly trackItem = (_: number, item: SearchItem): string => item.path;

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (openChange?.currentValue === true) {
      // Seed the query with any pre-typed character before the dialog opens.
      this.query.set(this.initialValue);
      // Wait one tick for the dialog animation, then focus the inner input.
      setTimeout(() => {
        const input = this.autocompleteEl?.nativeElement?.querySelector('input');
        input?.focus();
      }, 0);
    }
  }

  protected onValueChange(path: string | null): void {
    if (!path) return;
    void this.router.navigateByUrl(path);
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
