import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TngButtonComponent, TngDialogComponent, TngTable, TngTableCellTpl } from '@tailng-ui/components';
import type { TngTableColumn, TngTableRowClassFn } from '@tailng-ui/components';
import { TableRowIconButtonComponent } from '../../../../../../../shared/table-row-icon-button';
import { DateManagementService } from '../../../../../../../core/date/date-management.service';
import { bankTxnMaxAmount, remainingMatchAmount } from '../../../../data/bank-txn';
import type { BankTxn } from '../../../../data/bank-txn';
import { JournalAssignLedgerNamesService } from '../shared/journal-assign-ledger-names';
import { collectLedgerIds, formatAmount, toAssignJournalRows } from '../shared/journal-assign-table.util';
import type { AssignJournalTableRow, ExistingAssignment } from '../shared/journal-assign.types';

@Component({
  selector: 'app-journal-assign-assigned-section',
  standalone: true,
  imports: [
    TableRowIconButtonComponent,
    TngButtonComponent,
    TngDialogComponent,
    TngTable,
    TngTableCellTpl,
  ],
  templateUrl: './journal-assign-assigned-section.component.html',
  styleUrl: './journal-assign-assigned-section.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalAssignAssignedSectionComponent {
  private readonly dateManagement = inject(DateManagementService);
  private readonly ledgerNames = inject(JournalAssignLedgerNamesService);

  readonly loading = input(false);
  readonly assignments = input<readonly ExistingAssignment[]>([]);
  readonly bankTxn = input<BankTxn | null>(null);
  readonly disabled = input(false);
  readonly canUnassign = input(false);

  readonly unassign = output<string>();

  protected readonly assignedColumns: readonly TngTableColumn<AssignJournalTableRow>[] = [
    {
      id: 'journalGroupKey',
      label: 'Number',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      width: '11rem',
    },
    {
      id: 'date',
      label: 'Date',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      width: '9rem',
    },
    { id: 'ledgerid', label: 'Ledger', width: '15rem' },
    { id: 'debit', label: 'Debit', align: 'end', headerAlign: 'end', width: '9rem' },
    { id: 'credit', label: 'Credit', align: 'end', headerAlign: 'end', width: '9rem' },
    {
      id: 'description',
      label: 'Description',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      truncate: true,
    },
    {
      id: 'matchedAmount',
      label: 'Matched amount',
      accessor: 'journalGroupKey',
      align: 'end',
      groupBy: true,
      groupByAlign: 'top',
      headerAlign: 'end',
      width: '10rem',
    },
    {
      id: 'actions',
      label: 'Un-assign',
      accessor: 'journalGroupKey',
      groupBy: true,
      groupByAlign: 'top',
      align: 'end',
      headerAlign: 'end',
      width: '6.5rem',
    },
  ];

  protected readonly hasAssignments = computed(() => this.assignments().length > 0);

  protected readonly bankTxnMaxAmount = computed(() => bankTxnMaxAmount(this.bankTxn()));

  protected readonly existingMatchedTotal = computed(() =>
    this.assignments().reduce((sum, assignment) => sum + assignment.matchedAmount, 0),
  );

  protected readonly remainingMatchAmount = computed(() =>
    remainingMatchAmount(this.bankTxn(), this.assignments()),
  );

  protected readonly assignmentRows = computed<readonly AssignJournalTableRow[]>(() =>
    this.assignments().flatMap((assignment, index) =>
      toAssignJournalRows(assignment, index, assignment.matchedAmount),
    ),
  );

  private readonly journalGroupOrder = computed(() => {
    const order = new Map<string, number>();
    let i = 0;
    for (const row of this.assignmentRows()) {
      if (!order.has(row.journalGroupKey)) order.set(row.journalGroupKey, i++);
    }
    return order;
  });

  protected readonly rowClassFn = computed<TngTableRowClassFn<AssignJournalTableRow> | null>(() => {
    const order = this.journalGroupOrder();
    return (row) => ((order.get(row.journalGroupKey) ?? 0) % 2 === 1 ? 'journal-row--alt' : null);
  });

  protected readonly pendingUnassignJournalId = signal<string | null>(null);

  protected readonly pendingUnassignAssignment = computed(() => {
    const journalId = this.pendingUnassignJournalId();
    if (!journalId) return null;
    return this.assignments().find((assignment) => assignment.journal.id === journalId) ?? null;
  });

  constructor() {
    effect(() => {
      const assignments = this.assignments();
      if (!assignments.length) return;

      untracked(() => {
        void this.ledgerNames.fetchLedgerNames(
          collectLedgerIds(assignments.map((assignment) => assignment.journal)),
        );
      });
    });
  }

  protected formatDisplayDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected formatAmount = formatAmount;

  protected getLedgerName(ledgerid: string): string {
    return this.ledgerNames.getLedgerName(ledgerid);
  }

  protected openUnassignConfirm(journalId: string): void {
    if (this.disabled() || !this.canUnassign()) return;
    this.pendingUnassignJournalId.set(journalId);
  }

  protected closeUnassignConfirm(): void {
    this.pendingUnassignJournalId.set(null);
  }

  protected confirmUnassign(): void {
    const journalId = this.pendingUnassignJournalId();
    if (!journalId || this.disabled() || !this.canUnassign()) return;
    this.pendingUnassignJournalId.set(null);
    this.unassign.emit(journalId);
  }
}
