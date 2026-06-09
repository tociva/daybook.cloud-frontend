import { ChangeDetectionStrategy, Component, inject, input, output, viewChild } from '@angular/core';
import { TngButtonComponent, TngDialogComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { Journal } from '../../../data/journal';
import { JournalStore } from '../../../data/journal';
import { JournalCreateFormComponent } from '../../journal/create-journal/journal-create-form/journal-create-form.component';

@Component({
  selector: 'app-journal-create-dialog',
  standalone: true,
  imports: [JournalCreateFormComponent, TngButtonComponent, TngDialogComponent, TngIcon],
  templateUrl: './journal-create-dialog.component.html',
  styleUrl: './journal-create-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalCreateDialogComponent {
  protected readonly journalStore = inject(JournalStore);

  protected readonly journalForm = viewChild(JournalCreateFormComponent);

  readonly open = input.required<boolean>();

  readonly closed = output<void>();
  readonly created = output<void>();

  protected onDialogClosed(): void {
    if (this.journalStore.isLoading()) return;
    this.closed.emit();
  }

  protected onCancelled(): void {
    this.closed.emit();
  }

  protected async onSubmit(): Promise<void> {
    await this.journalForm()?.submit();
  }

  protected onFormSaved(_journal: Journal): void {
    this.created.emit();
  }
}
