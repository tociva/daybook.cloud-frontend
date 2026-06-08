import type { StatementColumnOption, StatementRow } from '../../../../../../shared/bank-statement-xlsx';

export type BankStatementFieldPath = 'txndate' | 'description' | 'bankref' | 'debit' | 'credit';

export type BankStatementField = Readonly<{
  aliases: readonly string[];
  label: string;
  path: BankStatementFieldPath;
  required?: boolean;
}>;

export type PendingStatement = Readonly<{
  columnOptions: readonly StatementColumnOption[];
  detectedHeaderRowIndex: number;
  file: File;
  fileSize: string;
  headerRowIndex: number;
  rows: readonly StatementRow[];
}>;

export type BankStatementFieldMappings = Record<BankStatementFieldPath, number | null>;

export type BankStatementUploadRow = Record<string, string | number | undefined>;

export type BankStatementPreviewRow = BankStatementUploadRow &
  Readonly<{
    rowNumber: number;
  }>;

export const BANK_STATEMENT_ACCEPT =
  '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const BANK_STATEMENT_MAX_SIZE = 1048576;

export const BANK_STATEMENT_UPLOAD_ENDPOINT = '/accounting/bank-txn/bulk-upload';

export const STATEMENT_FIELDS: readonly BankStatementField[] = [
  { label: 'Date', path: 'txndate', required: true, aliases: ['date', 'txn date', 'transaction date'] },
  {
    label: 'Narration',
    path: 'description',
    aliases: ['narration', 'description', 'particulars', 'remarks'],
  },
  {
    label: 'Bank reference',
    path: 'bankref',
    aliases: ['chq./ref.no.', 'chq/ref no', 'reference', 'ref no', 'utr', 'cheque no'],
  },
  {
    label: 'Inflow / deposit',
    path: 'debit',
    aliases: ['deposit amt.', 'deposit amt', 'deposit', 'deposits', 'credit amount', 'paid in'],
  },
  {
    label: 'Outflow / withdrawal',
    path: 'credit',
    aliases: [
      'withdrawal amt.',
      'withdrawal amt',
      'withdrawal',
      'withdrawals',
      'debit amount',
      'paid out',
    ],
  },
];

export function createEmptyFieldMappings(): BankStatementFieldMappings {
  return {
    bankref: null,
    credit: null,
    debit: null,
    description: null,
    txndate: null,
  };
}
