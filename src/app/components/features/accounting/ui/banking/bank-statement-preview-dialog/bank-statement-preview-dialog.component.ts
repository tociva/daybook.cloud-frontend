import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TngButtonComponent, TngDialogComponent, TngTable, TngTableCellTpl } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import type { BankStatementPreviewRow, PendingStatement } from '../bank-statement-upload/bank-statement-upload.model';

@Component({
  selector: 'app-bank-statement-preview-dialog',
  standalone: true,
  imports: [
    TableRowIconButtonComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngIcon,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './bank-statement-preview-dialog.component.html',
  styleUrl: './bank-statement-preview-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BankStatementPreviewDialogComponent {
  private readonly dateManagement = inject(DateManagementService);

  readonly open = input.required<boolean>();
  readonly statement = input.required<PendingStatement>();
  readonly previewRows = input.required<readonly BankStatementPreviewRow[]>();
  readonly bankAccountName = input('');
  readonly startingRow = input(1);
  readonly isUploading = input(false);

  readonly closed = output<void>();
  readonly back = output<void>();
  readonly confirmed = output<void>();
  readonly rowRemoved = output<number>();

  protected readonly previewColumns: readonly TngTableColumn<BankStatementPreviewRow>[] = [
    { id: 'rowNumber', label: 'Row', width: '7rem' },
    { id: 'txndate', label: 'Date', width: '9rem' },
    { id: 'description', label: 'Narration', truncate: true },
    { id: 'bankref', label: 'Reference', width: '12rem' },
    { id: 'debit', label: 'Inflow', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'credit', label: 'Outflow', align: 'end', headerAlign: 'end', width: '9rem' },
  ];

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected onDialogClosed(): void {
    this.closed.emit();
  }

  protected onBack(): void {
    this.back.emit();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
  }

  protected removeRow(row: BankStatementPreviewRow): void {
    if (this.isUploading()) return;

    this.rowRemoved.emit(row.rowNumber);
  }
}
