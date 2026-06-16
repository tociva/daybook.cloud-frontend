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
import { validateVendorPaymentBulkUploadPayload } from './vendor-payment-bulk-upload.validator';

type BulkUploadField = Readonly<{
  label: string;
  outputPath?: string;
  sourcePath: string;
}>;

const VENDOR_PAYMENT_XLSX_COLUMNS: readonly BulkUploadXlsxColumn[] = [
  { header: 'Date', path: 'date' },
  { header: 'Amount', path: 'amount' },
  { header: 'Vendor Name', path: 'vendorname' },
  { header: 'Bank/Cash Name', path: 'bcashname' },
  { header: 'Currency Code', path: 'currencycode' },
  { header: 'Description', path: 'description' },
  { header: 'Purchase Invoice Number', path: 'allocation.purchaseinvoicenumber' },
  { header: 'Allocation Amount', path: 'allocation.amount' },
];

const PAYMENT_FIELDS: readonly BulkUploadField[] = [
  { label: 'Date', sourcePath: 'date' },
  { label: 'Amount', sourcePath: 'amount' },
  { label: 'Vendor Name', sourcePath: 'vendorname' },
  { label: 'Bank/Cash Name', sourcePath: 'bcashname' },
  { label: 'Currency Code', sourcePath: 'currencycode' },
  { label: 'Description', sourcePath: 'description' },
];

const PAYMENT_REQUIRED_FIELDS: readonly BulkUploadField[] = [
  { label: 'Date', sourcePath: 'date' },
  { label: 'Amount', sourcePath: 'amount' },
  { label: 'Vendor Name', sourcePath: 'vendorname' },
  { label: 'Bank/Cash Name', sourcePath: 'bcashname' },
];

const ALLOCATION_FIELDS: readonly BulkUploadField[] = [
  {
    label: 'Purchase Invoice Number',
    outputPath: 'purchaseinvoicenumber',
    sourcePath: 'allocation.purchaseinvoicenumber',
  },
  { label: 'Allocation Amount', outputPath: 'amount', sourcePath: 'allocation.amount' },
];

const REQUIRED_VENDOR_PAYMENT_JSON_PATHS = ['date', 'amount', 'vendorname', 'bcashname'] as const;

export const VENDOR_PAYMENT_BULK_UPLOAD_CONFIG: BulkUploadPreviewConfig = {
  modelName: 'Vendor Payments',
  requiredPaths: REQUIRED_VENDOR_PAYMENT_JSON_PATHS,
  rootKey: 'payments',
  sampleRows: [
    {
      date: '2026-04-20',
      amount: 11800,
      vendorname: 'Acme Supplies',
      bcashname: 'HDFC Current Account',
      currencycode: 'INR',
      description: 'Payment against PI-001',
      invoices: [{ purchaseinvoicenumber: 'PI-001', amount: 11800 }],
    },
    {
      date: '2026-04-21',
      amount: 5000,
      vendorname: 'Acme Supplies',
      bcashname: 'Cash',
      description: 'Unallocated payment',
      invoices: [],
    },
  ],
  validatePayload: validateVendorPaymentBulkUploadPayload,
  xlsxColumns: VENDOR_PAYMENT_XLSX_COLUMNS,
  xlsxDateColumns: [{ header: 'Date', path: 'date', label: 'Payment date format' }],
  xlsxHelpText:
    'Use one row per payment or allocation. Leave Purchase Invoice Number and Allocation Amount blank for unallocated payments. For multiple allocations, put payment fields on the first row and only allocation fields on continuation rows.',
  xlsxRowsToPayloadRows: vendorPaymentXlsxRowsToPayloadRows,
  xlsxSampleRows: [
    {
      date: '2026-04-20',
      amount: 11800,
      vendorname: 'Acme Supplies',
      bcashname: 'HDFC Current Account',
      currencycode: 'INR',
      description: 'Payment against PI-001',
      allocation: { purchaseinvoicenumber: 'PI-001', amount: 11800 },
    },
    {
      date: '2026-04-21',
      amount: 5000,
      vendorname: 'Acme Supplies',
      bcashname: 'Cash',
      description: 'Unallocated payment',
    },
  ],
  xlsxSheetName: 'Vendor Payments',
  columns: [
    bulkUploadTextColumn('date', 'Date', 'date', '9rem'),
    bulkUploadTextColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
    bulkUploadTextColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
    bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    bulkUploadNumberColumn('amount', 'Amount', 'amount', '10rem'),
    bulkUploadCountColumn('invoices', 'Invoices', 'invoices', '8rem'),
    bulkUploadNamesColumn('description', 'Description', 'description'),
  ],
};

export function vendorPaymentXlsxRowsToPayloadRows(
  parsedRows: readonly BulkUploadXlsxParsedRow[],
): readonly BulkUploadPreviewRow[] | string {
  const payments: BulkUploadPreviewRow[] = [];
  let currentPayment: BulkUploadPreviewRow | null = null;

  for (const { row, rowNumber } of parsedRows) {
    const startsPayment = hasAnyValue(row, PAYMENT_FIELDS);
    const hasAllocationValues = hasAnyValue(row, ALLOCATION_FIELDS);

    if (startsPayment) {
      const paymentMissing = missingRequiredLabels(row, PAYMENT_REQUIRED_FIELDS);
      if (paymentMissing.length) {
        return `Payment starting at row ${rowNumber} is missing required values: ${paymentMissing.join(', ')}.`;
      }

      currentPayment = createVendorPaymentFromXlsxRow(row);
      payments.push(currentPayment);
    } else if (!currentPayment) {
      if (hasAllocationValues) {
        return `Row ${rowNumber} has allocation values before a payment. Start a payment before adding allocation rows.`;
      }

      return `Row ${rowNumber} must start a payment before adding allocation rows.`;
    }

    if (hasAllocationValues) {
      const allocationMissing = missingRequiredLabels(row, ALLOCATION_FIELDS);
      if (allocationMissing.length) {
        return `Allocation row ${rowNumber} is missing required values: ${allocationMissing.join(', ')}.`;
      }

      appendAllocationToPayment(currentPayment, createAllocationFromXlsxRow(row));
    }
  }

  return payments;
}

function createVendorPaymentFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return {
    ...copyFields(row, PAYMENT_FIELDS),
    invoices: [],
  };
}

function createAllocationFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return copyFields(row, ALLOCATION_FIELDS);
}

function appendAllocationToPayment(
  payment: BulkUploadPreviewRow,
  allocation: BulkUploadPreviewRow,
): void {
  const invoices = payment['invoices'];
  if (Array.isArray(invoices)) {
    invoices.push(allocation);
    return;
  }

  payment['invoices'] = [allocation];
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
