import { JournalSourceType } from './journal.model';

const JOURNAL_SOURCE_TYPE_LABELS: Readonly<Record<JournalSourceType, string>> = {
  [JournalSourceType.SALE_INVOICE]: 'Sale Invoice',
  [JournalSourceType.PURCHASE_INVOICE]: 'Purchase Invoice',
  [JournalSourceType.RECEIPT]: 'Customer Receipt',
  [JournalSourceType.PAYMENT]: 'Vendor Payment',
  [JournalSourceType.BANK_TXN]: 'Bank Transaction',
  [JournalSourceType.CONTRA_TRANSACTION]: 'Bank Contra',
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
  if (!value) return 'General';

  const knownLabel = JOURNAL_SOURCE_TYPE_LABELS[value as JournalSourceType];
  return knownLabel ?? formatUnknownSourceType(value);
}
