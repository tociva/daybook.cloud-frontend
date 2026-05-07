import { Component, HostListener, signal } from '@angular/core';
import { TngIcon } from '@tailng-ui/icons';
import { isMacPlatform } from '../../../core/system/platform.utils';
import { CommandSearchDialogComponent } from '../command-search-dialog/command-search-dialog.component';

@Component({
  selector: 'app-workspace-search',
  imports: [TngIcon, CommandSearchDialogComponent],
  templateUrl: './workspace-search.component.html',
  styleUrl: './workspace-search.component.css',
})
export class WorkspaceSearchComponent {
  protected readonly searchShortcutHint = isMacPlatform() ? '⌘K' : 'Ctrl K';
  protected readonly commandSearchOpen = signal(false);
  protected readonly searchInitialValue = signal('');

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

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openCommandSearch();
    }
  }
}
