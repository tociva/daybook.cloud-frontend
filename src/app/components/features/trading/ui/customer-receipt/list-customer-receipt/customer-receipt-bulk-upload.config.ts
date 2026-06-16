import {
  bulkUploadCountColumn,
  bulkUploadNamesColumn,
  bulkUploadNumberColumn,
  bulkUploadTextColumn,
  readBulkUploadPath,
  type BulkUploadPreviewConfig,
  type BulkUploadPreviewRow,
  type BulkUploadXlsxColumn,
  type BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import { validateCustomerReceiptBulkUploadPayload } from './customer-receipt-bulk-upload.validator';

type BulkUploadField = Readonly<{
  label: string;
  outputPath?: string;
  sourcePath: string;
}>;

const CUSTOMER_RECEIPT_XLSX_COLUMNS: readonly BulkUploadXlsxColumn[] = [
  { header: 'Receipt Number', path: 'number' },
  { header: 'Date', path: 'date' },
  { header: 'Amount', path: 'amount' },
  { header: 'Customer Name', path: 'customername' },
  { header: 'Bank/Cash Name', path: 'bcashname' },
  { header: 'Currency Code', path: 'currencycode' },
  { header: 'Description', path: 'description' },
  { header: 'Sale Invoice Number', path: 'allocation.saleinvoicenumber' },
  { header: 'Allocation Amount', path: 'allocation.amount' },
];

const RECEIPT_FIELDS: readonly BulkUploadField[] = [
  { label: 'Receipt Number', sourcePath: 'number' },
  { label: 'Date', sourcePath: 'date' },
  { label: 'Amount', sourcePath: 'amount' },
  { label: 'Customer Name', sourcePath: 'customername' },
  { label: 'Bank/Cash Name', sourcePath: 'bcashname' },
  { label: 'Currency Code', sourcePath: 'currencycode' },
  { label: 'Description', sourcePath: 'description' },
];

const RECEIPT_REQUIRED_FIELDS: readonly BulkUploadField[] = [
  { label: 'Date', sourcePath: 'date' },
  { label: 'Amount', sourcePath: 'amount' },
  { label: 'Customer Name', sourcePath: 'customername' },
  { label: 'Bank/Cash Name', sourcePath: 'bcashname' },
];

const ALLOCATION_FIELDS: readonly BulkUploadField[] = [
  {
    label: 'Sale Invoice Number',
    outputPath: 'saleinvoicenumber',
    sourcePath: 'allocation.saleinvoicenumber',
  },
  { label: 'Allocation Amount', outputPath: 'amount', sourcePath: 'allocation.amount' },
];

const REQUIRED_CUSTOMER_RECEIPT_JSON_PATHS = [
  'date',
  'amount',
  'customername',
  'bcashname',
] as const;

export const CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG: BulkUploadPreviewConfig = {
  modelName: 'Customer Receipts',
  requiredPaths: REQUIRED_CUSTOMER_RECEIPT_JSON_PATHS,
  rootKey: 'receipts',
  sampleRows: [
    {
      number: 'CR-001',
      date: '2026-04-20',
      amount: 11800,
      customername: 'Acme Retail',
      bcashname: 'HDFC Current Account',
      currencycode: 'INR',
      description: 'Receipt against SI-001',
      invoices: [{ saleinvoicenumber: 'SI-001', amount: 11800 }],
    },
    {
      date: '2026-04-21',
      amount: 5000,
      customername: 'Acme Retail',
      bcashname: 'Cash',
      description: 'Unallocated receipt',
      invoices: [],
    },
  ],
  validatePayload: validateCustomerReceiptBulkUploadPayload,
  xlsxColumns: CUSTOMER_RECEIPT_XLSX_COLUMNS,
  xlsxDateColumns: [{ header: 'Date', path: 'date', label: 'Receipt date format' }],
  xlsxHelpText:
    'Use one row per receipt or allocation. Leave Sale Invoice Number and Allocation Amount blank for unallocated receipts. For multiple allocations, put receipt fields on the first row and only allocation fields on continuation rows.',
  xlsxRowsToPayloadRows: customerReceiptXlsxRowsToPayloadRows,
  xlsxSampleRows: [
    {
      number: 'CR-001',
      date: '2026-04-20',
      amount: 11800,
      customername: 'Acme Retail',
      bcashname: 'HDFC Current Account',
      currencycode: 'INR',
      description: 'Receipt against SI-001',
      allocation: { saleinvoicenumber: 'SI-001', amount: 11800 },
    },
    {
      number: 'CR-002',
      date: '2026-04-21',
      amount: 5000,
      customername: 'Acme Retail',
      bcashname: 'Cash',
      description: 'Unallocated receipt',
    },
  ],
  xlsxSheetName: 'Customer Receipts',
  columns: [
    bulkUploadTextColumn('number', 'Number', 'number', '10rem'),
    bulkUploadTextColumn('date', 'Date', 'date', '9rem'),
    bulkUploadTextColumn('customername', 'Customer', 'customername', '14rem'),
    bulkUploadTextColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
    bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    bulkUploadNumberColumn('amount', 'Amount', 'amount', '10rem'),
    bulkUploadCountColumn('invoices', 'Invoices', 'invoices', '8rem'),
    bulkUploadNamesColumn('description', 'Description', 'description'),
  ],
};

export function customerReceiptXlsxRowsToPayloadRows(
  parsedRows: readonly BulkUploadXlsxParsedRow[],
): readonly BulkUploadPreviewRow[] | string {
  const receipts: BulkUploadPreviewRow[] = [];
  let currentReceipt: BulkUploadPreviewRow | null = null;

  for (const { row, rowNumber } of parsedRows) {
    const startsReceipt = hasAnyValue(row, RECEIPT_FIELDS);
    const hasAllocationValues = hasAnyValue(row, ALLOCATION_FIELDS);

    if (startsReceipt) {
      const receiptMissing = missingRequiredLabels(row, RECEIPT_REQUIRED_FIELDS);
      if (receiptMissing.length) {
        return `Receipt starting at row ${rowNumber} is missing required values: ${receiptMissing.join(', ')}.`;
      }

      currentReceipt = createCustomerReceiptFromXlsxRow(row);
      receipts.push(currentReceipt);
    } else if (!currentReceipt) {
      if (hasAllocationValues) {
        return `Row ${rowNumber} has allocation values before a receipt. Start a receipt before adding allocation rows.`;
      }

      return `Row ${rowNumber} must start a receipt before adding allocation rows.`;
    }

    if (hasAllocationValues) {
      const allocationMissing = missingRequiredLabels(row, ALLOCATION_FIELDS);
      if (allocationMissing.length) {
        return `Allocation row ${rowNumber} is missing required values: ${allocationMissing.join(', ')}.`;
      }

      appendAllocationToReceipt(currentReceipt, createAllocationFromXlsxRow(row));
    }
  }

  return receipts;
}

function createCustomerReceiptFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return {
    ...copyFields(row, RECEIPT_FIELDS),
    invoices: [],
  };
}

function createAllocationFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return copyFields(row, ALLOCATION_FIELDS);
}

function appendAllocationToReceipt(
  receipt: BulkUploadPreviewRow,
  allocation: BulkUploadPreviewRow,
): void {
  const invoices = receipt['invoices'];
  if (Array.isArray(invoices)) {
    invoices.push(allocation);
    return;
  }

  receipt['invoices'] = [allocation];
}

function copyFields(
  row: BulkUploadPreviewRow,
  fields: readonly BulkUploadField[],
): BulkUploadPreviewRow {
  const output: BulkUploadPreviewRow = {};
  for (const field of fields) {
    const value = readPath(row, field.sourcePath);
    if (!valueIsEmpty(value)) {
      setPath(output, field.outputPath ?? field.sourcePath, value);
    }
  }

  return output;
}

function hasAnyValue(row: BulkUploadPreviewRow, fields: readonly BulkUploadField[]): boolean {
  return fields.some((field) => !valueIsEmpty(readPath(row, field.sourcePath)));
}

function missingRequiredLabels(
  row: BulkUploadPreviewRow,
  fields: readonly BulkUploadField[],
): readonly string[] {
  return fields
    .filter((field) => valueIsEmpty(readPath(row, field.sourcePath)))
    .map((field) => field.label);
}

function readPath(row: BulkUploadPreviewRow, path: string): unknown {
  return readBulkUploadPath(row, path);
}

function setPath(row: BulkUploadPreviewRow, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = row;

  for (const part of parts.slice(0, -1)) {
    const next = current[part];
    if (!isRecord(next)) {
      current[part] = {};
    }
    current = current[part] as BulkUploadPreviewRow;
  }

  current[parts[parts.length - 1]] = value;
}

function valueIsEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
