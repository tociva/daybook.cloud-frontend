import type { JournalEntryCreatePayload } from './journal.model';

export type JournalFormRowInput = Readonly<{
  ledgerId: string;
  debitStr: string;
  creditStr: string;
}>;

const DEFAULT_MINOR_DIGITS = 2;

function roundMoney(value: number, minorDigits: number): number {
  const f = 10 ** minorDigits;
  return Math.round(value * f) / f;
}

function parsePositiveAmount(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number.parseFloat(t.replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Validates journal lines for submit and builds API `entries`.
 * Skips rows with ledger, debit, and credit all empty.
 */
export function validateJournalEntriesForSubmit(
  rows: readonly JournalFormRowInput[],
  minorDigits = DEFAULT_MINOR_DIGITS,
): { ok: true; entries: JournalEntryCreatePayload[] } | { ok: false; errors: readonly string[] } {
  const errors: string[] = [];

  const normalized = rows.filter(
    (r) => r.ledgerId.trim() !== '' || r.debitStr.trim() !== '' || r.creditStr.trim() !== '',
  );

  if (normalized.length < 2) {
    errors.push('Add at least two transactions with a ledger and a positive amount.');
  }

  const entries: JournalEntryCreatePayload[] = [];
  const seenLedgers = new Set<string>();
  let debitTotal = 0;
  let creditTotal = 0;
  let debitLineCount = 0;
  let creditLineCount = 0;

  for (const row of normalized) {
    const ledgerid = row.ledgerId.trim();
    const debit = parsePositiveAmount(row.debitStr);
    const credit = parsePositiveAmount(row.creditStr);

    if (debit != null && credit != null) {
      errors.push('Each transaction can have either debit or credit, not both.');
      continue;
    }

    const amount = debit ?? credit;

    if (!ledgerid) {
      errors.push('Each transaction with an amount must have a ledger selected.');
      continue;
    }
    if (amount === null) {
      errors.push('Debit and credit amounts must be positive numbers.');
      continue;
    }

    if (seenLedgers.has(ledgerid)) {
      errors.push('The same ledger cannot appear on more than one transaction.');
      continue;
    }
    seenLedgers.add(ledgerid);

    if (debit != null) {
      entries.push({ ledgerid, debit: amount });
      debitTotal += amount;
      debitLineCount += 1;
    } else {
      entries.push({ ledgerid, credit: amount });
      creditTotal += amount;
      creditLineCount += 1;
    }
  }

  if (debitLineCount === 0 || creditLineCount === 0) {
    errors.push('Include at least one debit transaction and one credit transaction.');
  }

  const dr = roundMoney(debitTotal, minorDigits);
  const cr = roundMoney(creditTotal, minorDigits);
  if (dr !== cr && normalized.length > 0) {
    errors.push(`Total debit (${dr}) must equal total credit (${cr}).`);
  }

  if (errors.length > 0) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  return { ok: true, entries };
}

export function isJournalFormRowEmpty(row: JournalFormRowInput): boolean {
  return (
    row.ledgerId.trim() === '' && row.debitStr.trim() === '' && row.creditStr.trim() === ''
  );
}

export function isJournalFormRowComplete(row: JournalFormRowInput): boolean {
  if (row.ledgerId.trim() === '') return false;

  const debit = parsePositiveAmount(row.debitStr);
  const credit = parsePositiveAmount(row.creditStr);
  if (debit != null && credit != null) return false;

  return debit != null || credit != null;
}

export function journalFormRowInput(row: Readonly<{
  ledgerId: string;
  debit: string;
  credit: string;
}>): JournalFormRowInput {
  return {
    ledgerId: row.ledgerId,
    debitStr: row.debit,
    creditStr: row.credit,
  };
}
