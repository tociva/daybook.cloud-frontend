import { parseIsoDate } from '../../../../../core/date/dayjs-date.utils';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../util/constants';
import type { Lb4Where } from '../../../../../shared/crud/lb4-query';
import type { Journal } from '../journal';
import type { BankTxn } from './bank-txn.model';

export const JOURNAL_ASSIGN_DATE_RANGE_DAYS = 7;

export type JournalMatchCandidate = Readonly<{
  journal: Journal;
  matchedAmount: number;
}>;

export function sumExistingMatchedAmount(matches: BankTxn['matches']): number {
  if (!matches?.length) return 0;

  return matches.reduce((sum, match) => {
    const amount = Number((match as { matchedamount?: number }).matchedamount ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

export function resolveBankLedgerId(
  txn: BankTxn,
  inventoryLedgerMaps: readonly { id?: string; ledgerid?: string }[],
): string {
  const fromInclude = txn.inventoryledgermap?.ledgerid?.trim();
  if (fromInclude) return fromInclude;

  const mapId = txn.inventoryledgermapid?.trim();
  if (!mapId) return '';

  const map =
    txn.inventoryledgermap?.id === mapId
      ? txn.inventoryledgermap
      : inventoryLedgerMaps.find((item) => item.id === mapId);

  return map?.ledgerid?.trim() ?? '';
}

export function getCompatibleJournalCandidates(
  journals: readonly Journal[],
  bankTxn: BankTxn,
  bankLedgerId: string,
): readonly JournalMatchCandidate[] {
  if (!bankLedgerId) return [];

  const linkedIds = new Set((bankTxn.journals ?? []).map((journal) => journal.id));
  const txnDebit = Number(bankTxn.debit ?? 0);
  const txnCredit = Number(bankTxn.credit ?? 0);

  return journals.flatMap((journal) => {
    if (!journal.id || linkedIds.has(journal.id)) return [];

    const bankEntry = journal.entries?.find((entry) => entry.ledgerid === bankLedgerId);
    if (!bankEntry) return [];

    const entryDebit = Number(bankEntry.debit ?? 0);
    const entryCredit = Number(bankEntry.credit ?? 0);

    if (txnDebit > 0 && entryDebit <= 0) return [];
    if (txnCredit > 0 && entryCredit <= 0) return [];

    const matchedAmount = entryDebit > 0 ? entryDebit : entryCredit;
    if (matchedAmount <= 0) return [];

    return [{ journal, matchedAmount }];
  });
}

export function bankTxnMaxAmount(txn: BankTxn | null | undefined): number {
  if (!txn) return 0;
  const debit = Number(txn.debit ?? 0);
  const credit = Number(txn.credit ?? 0);
  return debit > 0 ? debit : credit;
}

export function remainingMatchAmount(txn: BankTxn | null | undefined): number {
  const max = bankTxnMaxAmount(txn);
  if (max <= 0) return 0;
  return Math.max(0, max - sumExistingMatchedAmount(txn?.matches));
}

export function buildJournalDateRangeBounds(
  txnDate: string,
  days = JOURNAL_ASSIGN_DATE_RANGE_DAYS,
): Readonly<{ end: string; start: string }> | null {
  const parsed = parseIsoDate(txnDate);
  if (!parsed) return null;

  return {
    start: parsed.subtract(days, 'day').format(DEFAULT_NODE_DATE_FORMAT),
    end: parsed.add(days, 'day').format(DEFAULT_NODE_DATE_FORMAT),
  };
}

export function buildJournalDateRangeWhere(
  txnDate: string,
  days = JOURNAL_ASSIGN_DATE_RANGE_DAYS,
): Lb4Where | undefined {
  const bounds = buildJournalDateRangeBounds(txnDate, days);
  if (!bounds) return undefined;

  return { date: { between: [bounds.start, bounds.end] } };
}

export function buildJournalOutsideDateRangeWhere(
  txnDate: string,
  days = JOURNAL_ASSIGN_DATE_RANGE_DAYS,
): Lb4Where | undefined {
  const bounds = buildJournalDateRangeBounds(txnDate, days);
  if (!bounds) return undefined;

  return {
    or: [{ date: { lt: bounds.start } }, { date: { gt: bounds.end } }],
  };
}
