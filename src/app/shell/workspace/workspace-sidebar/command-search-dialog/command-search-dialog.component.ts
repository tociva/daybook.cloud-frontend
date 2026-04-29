import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TngDialogComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngInput, TngInputGroup, TngPrefix } from '@tailng-ui/primitives';

@Component({
  selector: 'app-command-search-dialog',
  imports: [TngDialogComponent, TngIcon, TngInput, TngInputGroup, TngPrefix],
  templateUrl: './command-search-dialog.component.html',
  styleUrl: './command-search-dialog.component.css',
})
export class CommandSearchDialogComponent {
  @Input() open = false;
  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<void>();

  protected onDialogClosed(): void {
    this.closed.emit();
  }

  protected onDialogOpenChange(next: boolean): void {
    this.openChange.emit(next);
  }
}
