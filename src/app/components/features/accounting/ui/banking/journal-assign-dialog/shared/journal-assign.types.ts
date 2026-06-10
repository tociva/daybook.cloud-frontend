import type { Journal, JournalEntry } from '../../../../data/journal';
import type { JournalMatchCandidate } from '../../../../data/bank-txn';

export type AssignMode = 'select' | 'create';

export type ExistingAssignment = Readonly<{
  journal: Journal;
  matchedAmount: number;
}>;

export type AssignJournalTableRow = Readonly<{
  credit: number | null | undefined;
  date: string;
  debit: number | null | undefined;
  defaultMatchedAmount: number;
  description: string;
  entry: JournalEntry | null;
  journal: Journal;
  journalGroupKey: string;
  ledgerid: string;
  matchedAmount: number;
  number: string;
  rowKey: string;
}>;

export type AssignJournalRowCandidate = JournalMatchCandidate | ExistingAssignment;
