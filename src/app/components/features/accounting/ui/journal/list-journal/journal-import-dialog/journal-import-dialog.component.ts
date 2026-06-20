import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  TngButtonComponent,
  TngDialogComponent,
  TngTable,
  TngTableCellTpl,
} from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { EmptyStateComponent } from '../../../../../../../shared/empty-state';
import { formatAmountWithCurrency } from '../../../../../../../shared/format/currency';

export type JournalImportDialogCandidate = Readonly<{
  id: string;
  amount: number | undefined;
  currencycode: string | undefined;
  date: string;
  number: string;
  party: string;
}>;

export type JournalImportDialogConfig = Readonly<{
  actionLabel: string;
  amountLabel: string;
  dialogTitle: string;
  emptyDescription: string;
  emptyTitle: string;
  itemLabel: string;
}>;

@Component({
  selector: 'app-journal-import-dialog',
  standalone: true,
  imports: [
    EmptyStateComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './journal-import-dialog.component.html',
  styleUrl: './journal-import-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalImportDialogComponent {
  private readonly dateManagement = inject(DateManagementService);

  readonly open = input.required<boolean>();
  readonly config = input<JournalImportDialogConfig | null>(null);
  readonly candidates = input<readonly JournalImportDialogCandidate[]>([]);
  readonly error = input<string | null>(null);
  readonly loading = input(false);
  readonly generating = input(false);

  readonly closed = output<void>();
  readonly cancelled = output<void>();
  readonly createRequested = output<void>();

  protected readonly columns = computed<readonly TngTableColumn<JournalImportDialogCandidate>[]>(
    () => [
      { id: 'number', label: 'Document', width: '11rem' },
      { id: 'party', label: 'Party', width: '15rem' },
      { id: 'date', label: 'Date', width: '9rem' },
      {
        id: 'amount',
        label: this.config()?.amountLabel ?? 'Amount',
        align: 'end',
        headerAlign: 'end',
        width: '11rem',
      },
    ],
  );

  protected readonly createDisabled = computed(
    () => this.loading() || this.generating() || this.candidates().length === 0,
  );

  protected formatDisplayDate(value: string | null | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount(item: JournalImportDialogCandidate): string {
    return formatAmountWithCurrency(item.amount, item.currencycode);
  }

  protected onDialogClosed(): void {
    this.closed.emit();
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }

  protected onCreate(): void {
    if (this.createDisabled()) return;

    this.createRequested.emit();
  }
}
