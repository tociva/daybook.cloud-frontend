import {
  formatAmountForInput,
  roundMoney,
} from '../../../../data/bank-txn/bank-txn-journal-match.util';
import type { Journal, JournalEntry } from '../../../../data/journal';
import type { AssignJournalRowCandidate, AssignJournalTableRow } from './journal-assign.types';

export { formatAmountForInput };

export function parseMatchedAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, '');
  if (!trimmed) return null;
  const value = Number.parseFloat(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function defaultMatchAmountForJournalSelection(
  currentRawAmount: string,
  journalAmount: number,
  remainingAmount: number,
  selectedMatchedTotal: number,
): string | null {
  if (parseMatchedAmount(currentRawAmount) !== null) return null;

  const availableAmount = roundMoney(Math.max(remainingAmount - selectedMatchedTotal, 0));
  const candidateAmount = roundMoney(Math.max(journalAmount, 0));
  const defaultAmount = roundMoney(Math.min(candidateAmount, availableAmount));

  return defaultAmount > 0 ? formatAmountForInput(defaultAmount) : null;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(roundMoney(value));
}

export function journalGroupKey(journal: Journal, index: number): string {
  return journal.id ?? `${journal.number}:${journal.date}:${index}`;
}

export function sortedEntries(
  entries: readonly JournalEntry[] | undefined,
): readonly JournalEntry[] {
  return [...(entries ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function collectLedgerIds(journals: readonly Journal[]): readonly string[] {
  return [
    ...new Set(
      journals
        .flatMap((journal) => journal.entries ?? [])
        .map((entry) => entry.ledgerid)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

export function toAssignJournalRows(
  candidate: AssignJournalRowCandidate,
  journalIndex: number,
  displayMatchedAmount: number,
): readonly AssignJournalTableRow[] {
  const journal = candidate.journal;
  const entries = sortedEntries(journal.entries);
  const groupKey = journalGroupKey(journal, journalIndex);
  const common = {
    date: journal.date,
    defaultMatchedAmount: candidate.matchedAmount,
    description: journal.description ?? '',
    journal,
    journalGroupKey: groupKey,
    matchedAmount: displayMatchedAmount,
    number: journal.number,
  };

  if (entries.length === 0) {
    return [
      {
        ...common,
        credit: null,
        debit: null,
        entry: null,
        ledgerid: '',
        rowKey: `${groupKey}:empty`,
      },
    ];
  }

  return entries.map((entry, entryIndex) => ({
    ...common,
    credit: entry.credit,
    debit: entry.debit,
    entry,
    ledgerid: entry.ledgerid,
    rowKey: entry.id ?? `${groupKey}:${entry.ledgerid}:${entry.order ?? entryIndex}`,
  }));
}
