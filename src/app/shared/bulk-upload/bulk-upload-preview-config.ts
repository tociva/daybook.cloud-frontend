import type { TngTableColumn } from '@tailng-ui/components';

export type BulkUploadPreviewRow = Record<string, unknown>;
export type BulkUploadPayload = Record<string, unknown>;

export type BulkUploadXlsxColumn = Readonly<{
  header: string;
  path: string;
}>;

export type BulkUploadPreviewDetail = Readonly<{
  label: string;
  value: string;
}>;

export type BulkUploadXlsxDateColumn = Readonly<{
  header: string;
  path: string;
  label?: string;
}>;

export type BulkUploadXlsxParsedRow = Readonly<{
  row: BulkUploadPreviewRow;
  rowNumber: number;
}>;

export type BulkUploadPreviewConfig = Readonly<{
  columns: readonly TngTableColumn<BulkUploadPreviewRow>[];
  modelName: string;
  requiredPaths: readonly string[];
  rootKey: string;
  sampleRows: readonly BulkUploadPreviewRow[];
  xlsxColumns?: readonly BulkUploadXlsxColumn[];
  xlsxDateColumns?: readonly BulkUploadXlsxDateColumn[];
  xlsxHelpText?: string;
  xlsxRequiredHeaders?: readonly string[];
  xlsxRowsToPayloadRows?: (
    rows: readonly BulkUploadXlsxParsedRow[],
  ) => readonly BulkUploadPreviewRow[] | string;
  xlsxSampleRows?: readonly BulkUploadPreviewRow[];
  xlsxSheetName?: string;
}>;

export const bulkUploadTextColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatBulkUploadPreviewValue(readBulkUploadPath(row, path)),
  ...(width ? { width } : {}),
});

export const bulkUploadNumberColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  align: 'end',
  headerAlign: 'end',
  accessor: (row) => formatBulkUploadPreviewValue(readBulkUploadPath(row, path)),
  ...(width ? { width } : {}),
});

export const bulkUploadCountColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  align: 'end',
  headerAlign: 'end',
  accessor: (row) => {
    const value = readBulkUploadPath(row, path);
    return Array.isArray(value) ? value.length : 0;
  },
  ...(width ? { width } : {}),
});

export const bulkUploadNamesColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatBulkUploadPreviewValue(readBulkUploadPath(row, path)),
  truncate: true,
  ...(width ? { width } : {}),
});

export function readBulkUploadPath(row: BulkUploadPreviewRow, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, row);
}

export function formatBulkUploadPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map((entry) => formatBulkUploadPreviewValue(formatArrayEntry(entry))).join(', ');
  }
  if (isRecord(value)) return JSON.stringify(value);

  return String(value);
}

export function totalBulkUploadEntryAmount(
  row: BulkUploadPreviewRow,
  amountKey: 'credit' | 'debit',
): string {
  const entries = readBulkUploadPath(row, 'entries');
  if (!Array.isArray(entries)) return '';

  const total = entries.reduce((sum, entry) => {
    if (!isRecord(entry)) return sum;

    const value = entry[amountKey];
    return typeof value === 'number' && Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return formatBulkUploadPreviewValue(total);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatArrayEntry(value: unknown): unknown {
  if (!isRecord(value)) return value;

  for (const key of ['name', 'number', 'ledger', 'saleinvoicenumber', 'purchaseinvoicenumber']) {
    const nestedValue = value[key];
    if (nestedValue !== null && nestedValue !== undefined && nestedValue !== '') {
      return nestedValue;
    }
  }

  return value;
}
