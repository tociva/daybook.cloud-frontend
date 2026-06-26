import { JournalSourceType } from './journal.model';

const JOURNAL_SOURCE_TYPE_LABELS: Readonly<Record<JournalSourceType, string>> = {
  [JournalSourceType.GENERAL]: 'Journal',
  [JournalSourceType.SALE_INVOICE]: 'Sale Invoice',
  [JournalSourceType.PURCHASE_INVOICE]: 'Purchase Invoice',
  [JournalSourceType.RECEIPT]: 'Customer Receipt',
  [JournalSourceType.PAYMENT]: 'Vendor Payment',
  [JournalSourceType.BANK_TXN]: 'Bank Transaction',
  [JournalSourceType.CONTRA_TRANSACTION]: 'Bank Contra',
  [JournalSourceType.CREDIT_NOTE]: 'Credit Note',
  [JournalSourceType.DEBIT_NOTE]: 'Debit Note',
};

function formatUnknownSourceType(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function journalSourceTypeLabel(
  value: JournalSourceType | string | null | undefined,
): string {
  if (!value) return JOURNAL_SOURCE_TYPE_LABELS[JournalSourceType.GENERAL];

  const knownLabel = JOURNAL_SOURCE_TYPE_LABELS[value as JournalSourceType];
  return knownLabel ?? formatUnknownSourceType(value);
}
