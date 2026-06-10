import { parseIsoDate } from '../../../../../core/date/dayjs-date.utils';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../util/constants';
import type { Lb4Where } from '../../../../../shared/crud/lb4-query';
import type { Journal } from '../journal';
import type { BankTxn } from './bank-txn.model';

export const JOURNAL_ASSIGN_DATE_RANGE_DAYS = 7;

const DEFAULT_MINOR_DIGITS = 2;

export function roundMoney(value: number, minorDigits = DEFAULT_MINOR_DIGITS): number {
  const factor = 10 ** minorDigits;
  return Math.round(value * factor) / factor;
}

export function formatAmountForInput(value: number, minorDigits = DEFAULT_MINOR_DIGITS): string {
  return roundMoney(value, minorDigits).toFixed(minorDigits);
}

export type JournalMatchCandidate = Readonly<{
  journal: Journal;
  matchedAmount: number;
}>;

export function journalBankLedgerMatchedAmount(
  journal: Journal,
  bankTxn: BankTxn,
  bankLedgerId: string,
): number {
  if (!bankLedgerId) return 0;

  const bankEntry = journal.entries?.find((entry) => entry.ledgerid === bankLedgerId);
  if (!bankEntry) return 0;

  const txnDebit = Number(bankTxn.debit ?? 0);
  const txnCredit = Number(bankTxn.credit ?? 0);
  const entryDebit = Number(bankEntry.debit ?? 0);
  const entryCredit = Number(bankEntry.credit ?? 0);

  if (txnDebit > 0 && entryDebit <= 0) return 0;
  if (txnCredit > 0 && entryCredit <= 0) return 0;

  const matchedAmount = entryDebit > 0 ? entryDebit : entryCredit;
  return matchedAmount > 0 ? roundMoney(matchedAmount) : 0;
}

export function sumExistingMatchedAmount(
  assignments?: readonly { matchedAmount?: number }[] | null,
): number {
  const total = (assignments ?? []).reduce((sum, item) => {
    const amount = Number(item.matchedAmount ?? 0);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
  return roundMoney(total);
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
  linkedJournalIds?: readonly string[],
): readonly JournalMatchCandidate[] {
  if (!bankLedgerId) return [];

  const linkedIds = new Set(
    linkedJournalIds !== undefined
      ? linkedJournalIds
      : (bankTxn.journals ?? []).map((journal) => journal.id),
  );

  return journals.flatMap((journal) => {
    if (!journal.id || linkedIds.has(journal.id)) return [];

    const matchedAmount = journalBankLedgerMatchedAmount(journal, bankTxn, bankLedgerId);
    if (matchedAmount <= 0) return [];

    return [{ journal, matchedAmount }];
  });
}

export function bankTxnMaxAmount(txn: BankTxn | null | undefined): number {
  if (!txn) return 0;
  const debit = Number(txn.debit ?? 0);
  const credit = Number(txn.credit ?? 0);
  return roundMoney(debit > 0 ? debit : credit);
}

export function remainingMatchAmount(
  txn: BankTxn | null | undefined,
  assignments?: readonly { matchedAmount?: number }[] | null,
): number {
  const max = bankTxnMaxAmount(txn);
  if (max <= 0) return 0;
  return roundMoney(Math.max(0, max - sumExistingMatchedAmount(assignments)));
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
