import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { TngDialogComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { TngInput, TngInputGroup, TngPrefix } from '@tailng-ui/primitives';

@Component({
  selector: 'app-command-search-dialog',
  imports: [TngDialogComponent, TngIcon, TngInput, TngInputGroup, TngPrefix],
  templateUrl: './command-search-dialog.component.html',
  styleUrl: './command-search-dialog.component.css',
})
export class CommandSearchDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() initialValue = '';
  @Output() readonly openChange = new EventEmitter<boolean>();
  @Output() readonly closed = new EventEmitter<void>();

  @ViewChild('searchInput') private readonly searchInput!: ElementRef<HTMLInputElement>;

  ngOnChanges(changes: SimpleChanges): void {
    const openChange = changes['open'];
    if (openChange?.currentValue === true) {
      // Wait one tick for the dialog's animation/display to settle, then
      // focus the input and seed it with any pre-typed character.
      setTimeout(() => {
        const input = this.searchInput?.nativeElement;
        if (!input) return;

        input.value = this.initialValue;
        // Place cursor at the end so the user can keep typing naturally.
        const len = input.value.length;
        input.setSelectionRange(len, len);
        input.focus();
      }, 0);
    }
  }

  protected onDialogClosed(): void {
    this.closed.emit();
  }

  protected onDialogOpenChange(next: boolean): void {
    this.openChange.emit(next);
  }
}
