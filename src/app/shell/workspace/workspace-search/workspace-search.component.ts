import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TngIcon } from '@tailng-ui/icons';
import { fromEvent } from 'rxjs';
import { isMacPlatform } from '../../../core/system/platform.utils';
import { CommandSearchDialogComponent } from '../command-search-dialog/command-search-dialog.component';

@Component({
  selector: 'app-workspace-search',
  imports: [TngIcon, CommandSearchDialogComponent],
  templateUrl: './workspace-search.component.html',
  styleUrl: './workspace-search.component.css',
})
export class WorkspaceSearchComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly searchShortcutHint = isMacPlatform() ? '⌘K' : 'Ctrl K';
  protected readonly commandSearchOpen = signal(false);
  protected readonly searchInitialValue = signal('');

  constructor() {
    fromEvent<KeyboardEvent>(this.document, 'keydown')
      .pipe(takeUntilDestroyed())
      .subscribe((event) => this.onDocumentKeydown(event));
  }

  protected openCommandSearch(initialValue = ''): void {
    this.searchInitialValue.set(initialValue);
    this.commandSearchOpen.set(true);
  }

  protected onSearchBtnKeydown(event: KeyboardEvent): void {
    // Open on any printable character; ignore modifier-only combos and special keys.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      // Space opens the dialog but does not seed the input with whitespace.
      this.openCommandSearch(event.key.trim());
    }
  }

  protected onCommandSearchClosed(): void {
    this.searchInitialValue.set('');
    this.commandSearchOpen.set(false);
  }

  protected onCommandSearchOpenChange(next: boolean): void {
    this.commandSearchOpen.set(next);
  }

  private onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openCommandSearch();
    }
  }
}
