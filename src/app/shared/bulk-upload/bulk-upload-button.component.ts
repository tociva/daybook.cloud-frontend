import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TngButtonComponent, TngDialogComponent, TngTable } from '@tailng-ui/components';
import type { TngTableColumn } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import {
  TngFileUploadDirective,
  TngPopover,
  TngPopoverPanel,
  TngPopoverTrigger,
  type TngFileUploadRejectedEvent,
  type TngFileUploadSelectedEvent,
} from '@tailng-ui/primitives';
import { getApiErrorMessage } from '../../core/api/api-error.util';
import { ToastStore } from '../../core/toast/toast.store';
import type {
  BulkUploadPayload,
  BulkUploadPreviewDetail,
  BulkUploadPreviewConfig,
  BulkUploadPreviewRow,
  BulkUploadXlsxColumn,
  BulkUploadXlsxDateColumn,
  BulkUploadXlsxParsedRow,
} from './bulk-upload-preview-config';
import { BulkUploadService } from './bulk-upload.service';

const DEFAULT_ACCEPT =
  '.json,.xlsx,application/json,text/json,application/octet-stream,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DEFAULT_MAX_SIZE = 1048576;
const ACCEPTED_MIME_TYPES = new Set(['application/json', 'text/json', 'application/octet-stream']);
const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ACCEPTED_XLSX_MIME_TYPES = new Set([XLSX_MIME_TYPE, 'application/vnd.ms-excel']);

type BulkUploadFormat = 'json' | 'xlsx';
type XlsxCellParseResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; message: string }>;
type BulkUploadReadResult = Readonly<{
  payload: BulkUploadPayload;
  previewDetails?: readonly BulkUploadPreviewDetail[];
}>;
type DetectedXlsxDateFormat = Readonly<{
  label: string;
  order: 'date-cell' | 'dmy' | 'mdy' | 'ymd';
  separator?: '-' | '.' | '/';
  yearDigits?: 2 | 4;
}>;
type XlsxDateFormatDetection =
  | Readonly<{ ok: true; format: DetectedXlsxDateFormat }>
  | Readonly<{ ok: false; message: string }>;
type XlsxDateColumnValue = Readonly<{
  rowNumber: number;
  value: unknown;
}>;
type ParsedDateTextParts = Readonly<
  | {
      kind: 'ymd';
      separator: '-' | '.' | '/';
      yearDigits: 4;
    }
  | {
      first: number;
      kind: 'numeric';
      second: number;
      separator: '-' | '.' | '/';
      yearDigits: 2 | 4;
    }
>;

type BulkUploadPreview = Readonly<{
  columns: readonly TngTableColumn<BulkUploadPreviewRow>[];
  details: readonly BulkUploadPreviewDetail[];
  file: File;
  fileSize: string;
  modelName: string;
  rowCount: number;
  rootKey: string;
  rootKeys: readonly string[];
  rows: readonly BulkUploadPreviewRow[];
  uploadFile: File;
}>;

type BulkUploadInfo = Readonly<{
  modelName: string;
  requiredColumns: readonly string[];
  rootKey: string;
  usesJsonXlsxCells: boolean;
  usesFieldPathHeaders: boolean;
  xlsxHelpText: string | null;
}>;

const textColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  ...(width ? { width } : {}),
});

const numberColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  align: 'end',
  headerAlign: 'end',
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  ...(width ? { width } : {}),
});

const countColumn = (
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
    const value = readPath(row, path);
    return Array.isArray(value) ? value.length : 0;
  },
  ...(width ? { width } : {}),
});

const namesColumn = (
  id: string,
  label: string,
  path: string,
  width?: string,
): TngTableColumn<BulkUploadPreviewRow> => ({
  id,
  label,
  accessor: (row) => formatPreviewValue(readPath(row, path)),
  truncate: true,
  ...(width ? { width } : {}),
});

const BULK_UPLOAD_PREVIEW_CONFIGS: Record<string, BulkUploadPreviewConfig> = {
  '/inventory/item/bulk-upload': {
    modelName: 'Items',
    requiredPaths: ['name', 'code', 'displayname', 'category'],
    rootKey: 'items',
    sampleRows: [
      {
        name: 'Laptop',
        code: 'LAP-001',
        displayname: 'Laptop',
        barcode: '890000000001',
        description: 'Business laptop',
        purchaseledger: 'Purchase Account',
        salesledger: 'Sales Account',
        category: 'Electronics',
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '12rem'),
      textColumn('code', 'Code', 'code', '8rem'),
      textColumn('displayname', 'Display name', 'displayname', '12rem'),
      textColumn('category', 'Category', 'category', '12rem'),
      textColumn('barcode', 'Barcode', 'barcode', '10rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/item-category/bulk-upload': {
    modelName: 'Item Categories',
    requiredPaths: ['name', 'code', 'type'],
    rootKey: 'itemCategory',
    sampleRows: [
      {
        name: 'Electronics',
        code: 'ELEC',
        type: 'Product',
        description: 'Electronic goods',
        parent: '',
        taxgroup: '',
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '12rem'),
      textColumn('code', 'Code', 'code', '8rem'),
      textColumn('type', 'Type', 'type', '8rem'),
      textColumn('parent', 'Parent', 'parent', '12rem'),
      textColumn('taxgroup', 'Tax group', 'taxgroup', '12rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/tax/bulk-upload': {
    modelName: 'Taxes',
    requiredPaths: ['name', 'shortname', 'rate', 'appliedto'],
    rootKey: 'taxes',
    sampleRows: [
      {
        name: 'CGST 9%',
        shortname: 'CGST',
        rate: 9,
        appliedto: 1,
        description: 'Central GST',
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('shortname', 'Short name', 'shortname', '9rem'),
      numberColumn('rate', 'Rate', 'rate', '7rem'),
      numberColumn('appliedto', 'Applied to', 'appliedto', '8rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/tax-group/bulk-upload': {
    modelName: 'Tax Groups',
    requiredPaths: ['name', 'rate'],
    rootKey: 'taxgroups',
    sampleRows: [
      {
        name: 'GST 18%',
        rate: 18,
        description: 'CGST + SGST',
        groups: [{ mode: 'intra-state', taxes: ['CGST 9%', 'SGST 9%'] }],
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      numberColumn('rate', 'Rate', 'rate', '7rem'),
      countColumn('groups', 'Groups', 'groups', '7rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/inventory/customer/bulk-upload': {
    modelName: 'Customers',
    requiredPaths: [
      'name',
      'address.name',
      'address.line1',
      'address.street',
      'address.city',
      'address.state',
      'address.zip',
      'address.country',
      'countrycode',
      'currencycode',
    ],
    rootKey: 'customers',
    sampleRows: [
      {
        name: 'Acme Retail',
        mobile: '+91 9876543210',
        email: 'billing@acme.example',
        gstin: '29ABCDE1234F1Z5',
        address: {
          name: 'Acme Retail',
          line1: 'Plot 10',
          line2: '',
          street: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560001',
          country: 'India',
        },
        countrycode: 'IN',
        state: 'Karnataka',
        currencycode: 'INR',
        description: 'Retail customer',
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('mobile', 'Mobile', 'mobile', '10rem'),
      textColumn('email', 'Email', 'email', '14rem'),
      textColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      textColumn('city', 'City', 'address.city', '10rem'),
      textColumn('state', 'State', 'state', '10rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  },
  '/inventory/vendor/bulk-upload': {
    modelName: 'Vendors',
    requiredPaths: [
      'name',
      'address.name',
      'address.line1',
      'address.street',
      'address.city',
      'address.state',
      'address.zip',
      'address.country',
      'countrycode',
      'currencycode',
    ],
    rootKey: 'vendors',
    sampleRows: [
      {
        name: 'Acme Supplies',
        mobile: '+91 9876543210',
        email: 'sales@acme-supplies.example',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        address: {
          name: 'Acme Supplies',
          line1: 'Warehouse 2',
          line2: '',
          street: 'Industrial Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560002',
          country: 'India',
        },
        countrycode: 'IN',
        state: 'Karnataka',
        currencycode: 'INR',
        description: 'Primary supplier',
      },
    ],
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('mobile', 'Mobile', 'mobile', '10rem'),
      textColumn('email', 'Email', 'email', '14rem'),
      textColumn('gstin', 'GSTIN', 'gstin', '12rem'),
      textColumn('pan', 'PAN', 'pan', '9rem'),
      textColumn('city', 'City', 'address.city', '10rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    ],
  },
  '/inventory/purchase-invoice/bulk-upload': {
    modelName: 'Purchase Invoices',
    requiredPaths: [
      'number',
      'date',
      'duedate',
      'currencycode',
      'vendorname',
      'itemtotal',
      'subtotal',
      'grandtotal',
      'items',
    ],
    rootKey: 'invoices',
    sampleRows: [
      {
        number: 'PI-001',
        date: '2026-04-01',
        duedate: '2026-04-15',
        currencycode: 'INR',
        vendorname: 'Acme Supplies',
        itemtotal: 10000,
        discount: 0,
        subtotal: 10000,
        tax: 1800,
        roundoff: 0,
        grandtotal: 11800,
        description: 'Business laptop purchase',
        taxoption: 'exclusive',
        items: [
          {
            name: 'Laptop',
            displayname: 'Laptop',
            order: 1,
            code: 'LAP-001',
            price: 10000,
            quantity: 1,
            itemtotal: 10000,
            subtotal: 10000,
            taxes: [{ name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 10000, amount: 900 }],
            taxamount: 900,
            grandtotal: 10900,
          },
        ],
      },
    ],
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      countColumn('items', 'Items', 'items', '7rem'),
      numberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
      numberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
    ],
  },
  '/inventory/sale-invoice/bulk-upload': {
    modelName: 'Sale Invoices',
    requiredPaths: [
      'number',
      'date',
      'duedate',
      'currencycode',
      'customername',
      'billingaddress.name',
      'billingaddress.line1',
      'billingaddress.street',
      'billingaddress.city',
      'billingaddress.state',
      'billingaddress.zip',
      'billingaddress.country',
      'shippingaddress.name',
      'shippingaddress.line1',
      'shippingaddress.street',
      'shippingaddress.city',
      'shippingaddress.state',
      'shippingaddress.zip',
      'shippingaddress.country',
      'itemtotal',
      'subtotal',
      'grandtotal',
      'items',
    ],
    rootKey: 'invoices',
    sampleRows: [
      {
        number: 'SI-001',
        date: '2026-04-01',
        duedate: '2026-04-15',
        currencycode: 'INR',
        customername: 'Acme Retail',
        billingaddress: {
          name: 'Acme Retail',
          line1: 'Plot 10',
          line2: '',
          street: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560001',
          country: 'India',
        },
        shippingaddress: {
          name: 'Acme Retail',
          line1: 'Plot 10',
          line2: '',
          street: 'MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          zip: '560001',
          country: 'India',
        },
        itemtotal: 10000,
        discount: 0,
        subtotal: 10000,
        tax: 1800,
        roundoff: 0,
        grandtotal: 11800,
        deliverystate: 'Karnataka',
        taxoption: 'exclusive',
        items: [
          {
            name: 'Laptop',
            displayname: 'Laptop',
            order: 1,
            code: 'LAP-001',
            price: 10000,
            quantity: 1,
            itemtotal: 10000,
            subtotal: 10000,
            taxes: [{ name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 10000, amount: 900 }],
            taxamount: 900,
            grandtotal: 10900,
          },
        ],
      },
    ],
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('customername', 'Customer', 'customername', '14rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      countColumn('items', 'Items', 'items', '7rem'),
      numberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
      numberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
    ],
  },
  '/inventory/customer-receipt/bulk-upload': {
    modelName: 'Customer Receipts',
    requiredPaths: ['date', 'amount', 'currencycode', 'customername', 'bcashname', 'invoices'],
    rootKey: 'receipts',
    sampleRows: [
      {
        number: 'CR-001',
        date: '2026-04-20',
        amount: 11800,
        currencycode: 'INR',
        customername: 'Acme Retail',
        bcashname: 'HDFC Current Account',
        description: 'Receipt against SI-001',
        invoices: [{ saleinvoicenumber: 'SI-001', amount: 11800 }],
      },
    ],
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('customername', 'Customer', 'customername', '14rem'),
      textColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      numberColumn('amount', 'Amount', 'amount', '10rem'),
      countColumn('invoices', 'Invoices', 'invoices', '8rem'),
    ],
  },
  '/inventory/vendor-payment/bulk-upload': {
    modelName: 'Vendor Payments',
    requiredPaths: ['date', 'amount', 'currencycode', 'vendorname', 'bcashname', 'invoices'],
    rootKey: 'payments',
    sampleRows: [
      {
        date: '2026-04-20',
        amount: 11800,
        currencycode: 'INR',
        vendorname: 'Acme Supplies',
        bcashname: 'HDFC Current Account',
        description: 'Payment against PI-001',
        invoices: [{ purchaseinvoicenumber: 'PI-001', amount: 11800 }],
      },
    ],
    columns: [
      textColumn('date', 'Date', 'date', '9rem'),
      textColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
      textColumn('bcashname', 'Bank/Cash', 'bcashname', '12rem'),
      textColumn('currencycode', 'Currency', 'currencycode', '8rem'),
      numberColumn('amount', 'Amount', 'amount', '10rem'),
      countColumn('invoices', 'Invoices', 'invoices', '8rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/ledger-category/bulk-upload': {
    modelName: 'Ledger Categories',
    requiredPaths: ['name'],
    rootKey: 'ledgerCategory',
    sampleRows: [
      {
        name: 'Assets',
        parent: '',
        type: 'Asset',
        description: 'Root level ledger category for Assets',
      },
      {
        name: 'Liabilities',
        parent: '',
        type: 'Liability',
        description: 'Root level ledger category for Liabilities',
      },
      {
        name: 'Income',
        parent: '',
        type: 'Income',
        description: 'Root level ledger category for Income',
      },
      {
        name: 'Expenses',
        parent: '',
        type: 'Expense',
        description: 'Root level ledger category for Expenses',
      },
      {
        name: 'Current Assets',
        parent: 'Assets',
        type: 'Current Asset',
        description: 'Groups current asset ledger categories under Assets',
      },
      {
        name: 'Current Liabilities',
        parent: 'Liabilities',
        type: 'Current Liability',
        description: 'Groups current liability ledger categories under Liabilities',
      },
      {
        name: 'Fixed Assets',
        parent: 'Assets',
        type: 'Fixed Asset',
        description: 'Groups fixed asset ledger categories under Assets',
      },
      {
        name: 'Long-Term Liabilities',
        parent: 'Liabilities',
        type: 'Long-Term Liability',
        description: 'Groups long-term liability ledger categories under Liabilities',
      },
      {
        name: 'Sundry Debtors',
        parent: 'Current Assets',
        type: 'Sundry Debtors',
        description: 'Customer receivables under Current Assets',
      },
      {
        name: 'Sundry Creditors',
        parent: 'Current Liabilities',
        type: 'Sundry Creditors',
        description: 'Supplier payables under Current Liabilities',
      },
      {
        name: 'Bank Accounts',
        parent: 'Current Assets',
        type: 'Bank Accounts',
        description: 'Bank account ledgers under Current Assets',
      },
      {
        name: 'Cash in Hand',
        parent: 'Current Assets',
        type: 'Cash in Hand',
        description: 'Cash ledgers under Current Assets',
      },
      {
        name: 'Direct Income',
        parent: 'Income',
        type: 'Direct Income',
        description: 'Direct income ledger categories under Income',
      },
      {
        name: 'Indirect Income',
        parent: 'Income',
        type: 'Indirect Income',
        description: 'Indirect income ledger categories under Income',
      },
      {
        name: 'Direct Expense',
        parent: 'Expenses',
        type: 'Direct Expense',
        description: 'Direct expense ledger categories under Expenses',
      },
      {
        name: 'Indirect Expense',
        parent: 'Expenses',
        type: 'Indirect Expense',
        description: 'Indirect expense ledger categories under Expenses',
      },
    ],
    xlsxColumns: [
      { header: 'Name', path: 'name' },
      { header: 'Parent Name', path: 'parent' },
      { header: 'Type', path: 'type' },
      { header: 'Description', path: 'description' },
    ],
    xlsxSheetName: 'Ledger Categories',
    columns: [
      textColumn('name', 'Name', 'name', '14rem'),
      textColumn('type', 'Type', 'type', '10rem'),
      textColumn('parent', 'Parent Name', 'parent', '14rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/bank-txn/bulk-upload': {
    modelName: 'Bank Transactions',
    requiredPaths: ['bankname', 'txndate'],
    rootKey: 'bankTxns',
    sampleRows: [
      {
        bankname: 'HDFC Current Account',
        txndate: '2026-04-05',
        description: 'Customer payment',
        debit: 11800,
        credit: '',
        bankref: 'NEFT-001',
      },
    ],
    columns: [
      textColumn('bankname', 'Bank/Cash', 'bankname', '14rem'),
      textColumn('txndate', 'Date', 'txndate', '9rem'),
      numberColumn('debit', 'Debit', 'debit', '9rem'),
      numberColumn('credit', 'Credit', 'credit', '9rem'),
      textColumn('bankref', 'Bank ref', 'bankref', '12rem'),
      namesColumn('description', 'Description', 'description'),
    ],
  },
  '/accounting/journal/bulk-upload': {
    modelName: 'Journals',
    requiredPaths: ['date', 'entries'],
    rootKey: 'journals',
    sampleRows: [
      {
        number: 'JV-001',
        date: '2026-04-10',
        description: 'Sales accrual',
        entries: [
          { ledger: 'Cash in Hand', debit: 11800 },
          { ledger: 'Software Sales', credit: 11800 },
        ],
      },
    ],
    xlsxColumns: [
      { header: 'Number', path: 'number' },
      { header: 'Date', path: 'date' },
      { header: 'Ledger', path: 'ledger' },
      { header: 'Debit', path: 'debit' },
      { header: 'Credit', path: 'credit' },
      { header: 'Description', path: 'description' },
    ],
    xlsxDateColumns: [{ header: 'Date', path: 'date', label: 'Date format' }],
    xlsxHelpText:
      'Use one row per journal transaction. Put Number, Date, and Description only on the first row for a journal; leave them blank on continuation rows.',
    xlsxRequiredHeaders: ['Number', 'Date', 'Ledger', 'Debit', 'Credit', 'Description'],
    xlsxRowsToPayloadRows: journalXlsxRowsToPayloadRows,
    xlsxSampleRows: [
      {
        number: 'JV-001',
        date: '2026-04-10',
        ledger: 'Cash in Hand',
        debit: 11800,
        credit: '',
        description: 'Sales accrual',
      },
      {
        number: '',
        date: '',
        ledger: 'Software Sales',
        debit: '',
        credit: 11800,
        description: '',
      },
    ],
    xlsxSheetName: 'Journals',
    columns: [
      textColumn('number', 'Number', 'number', '10rem'),
      textColumn('date', 'Date', 'date', '9rem'),
      countColumn('entries', 'Entries', 'entries', '8rem'),
      {
        id: 'totaldebit',
        label: 'Total debit',
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
        accessor: (row) => totalEntryAmount(row, 'debit'),
      },
      {
        id: 'totalcredit',
        label: 'Total credit',
        align: 'end',
        headerAlign: 'end',
        width: '10rem',
        accessor: (row) => totalEntryAmount(row, 'credit'),
      },
      namesColumn('description', 'Description', 'description'),
    ],
  },
};

function journalXlsxRowsToPayloadRows(
  parsedRows: readonly BulkUploadXlsxParsedRow[],
): readonly BulkUploadPreviewRow[] | string {
  const journals: BulkUploadPreviewRow[] = [];
  let currentJournal: BulkUploadPreviewRow | null = null;
  let currentStartRow = 0;

  for (const { row, rowNumber } of parsedRows) {
    const number = readPath(row, 'number');
    const date = readPath(row, 'date');
    const description = readPath(row, 'description');
    const ledger = readPath(row, 'ledger');
    const debit = readPath(row, 'debit');
    const credit = readPath(row, 'credit');
    const startsJournal = !valueIsEmpty(date);

    if (startsJournal) {
      const previousError = validateJournalXlsxPayloadRow(currentJournal, currentStartRow);
      if (previousError) return previousError;

      currentJournal = {
        ...(valueIsEmpty(number) ? {} : { number }),
        date,
        ...(valueIsEmpty(description) ? {} : { description }),
        entries: [],
      };
      currentStartRow = rowNumber;
      journals.push(currentJournal);
    } else if (!valueIsEmpty(number) || !valueIsEmpty(description)) {
      return `Row ${rowNumber} has journal header values but no Date. Put Date on the first row for each journal.`;
    }

    if (!currentJournal) {
      return `Row ${rowNumber} must start a journal with a Date before adding transaction rows.`;
    }

    if (valueIsEmpty(ledger)) {
      return `Row ${rowNumber} is missing required value: Ledger.`;
    }

    const hasDebit = !valueIsEmpty(debit);
    const hasCredit = !valueIsEmpty(credit);
    if (hasDebit === hasCredit) {
      return `Row ${rowNumber} must contain either Debit or Credit, but not both.`;
    }

    const entry: BulkUploadPreviewRow = { ledger };
    if (hasDebit) {
      entry['debit'] = debit;
    } else {
      entry['credit'] = credit;
    }

    (currentJournal['entries'] as BulkUploadPreviewRow[]).push(entry);
  }

  const finalError = validateJournalXlsxPayloadRow(currentJournal, currentStartRow);
  if (finalError) return finalError;

  return journals;
}

function validateJournalXlsxPayloadRow(
  journal: BulkUploadPreviewRow | null,
  rowNumber: number,
): string | null {
  if (!journal) return null;

  const date = readPath(journal, 'date');
  if (typeof date !== 'string' || !isIsoDateString(date)) {
    return `Journal starting at row ${rowNumber} must have Date formatted as YYYY-MM-DD.`;
  }

  const entries = readPath(journal, 'entries');
  if (!Array.isArray(entries) || entries.length < 2) {
    return `Journal starting at row ${rowNumber} must include at least 2 transaction rows.`;
  }

  return null;
}

function isIsoDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function normalizeEndpointPath(endpointPath: string): string {
  let pathname = endpointPath.trim();

  try {
    pathname = new URL(pathname).pathname;
  } catch {
    // Plain endpoint paths are expected here.
  }

  return `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPath(row: BulkUploadPreviewRow, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, row);
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    return value.map((entry) => formatPreviewValue(formatArrayEntry(entry))).join(', ');
  }
  if (isRecord(value)) return JSON.stringify(value);

  return String(value);
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

function totalEntryAmount(row: BulkUploadPreviewRow, amountKey: 'credit' | 'debit'): string {
  const entries = readPath(row, 'entries');
  if (!Array.isArray(entries)) return '';

  const total = entries.reduce((sum, entry) => {
    if (!isRecord(entry)) return sum;

    const value = entry[amountKey];
    return typeof value === 'number' && Number.isFinite(value) ? sum + value : sum;
  }, 0);

  return formatPreviewValue(total);
}

function collectXlsxPaths(row: BulkUploadPreviewRow, prefix = ''): readonly string[] {
  return Object.keys(row).flatMap((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const value = row[key];

    if (isRecord(value)) {
      return collectXlsxPaths(value, path);
    }

    return [path];
  });
}

function collectDefaultXlsxColumns(config: BulkUploadPreviewConfig): readonly BulkUploadXlsxColumn[] {
  const seen = new Set<string>();
  const columns: BulkUploadXlsxColumn[] = [];

  for (const row of config.sampleRows) {
    for (const path of collectXlsxPaths(row)) {
      if (!seen.has(path)) {
        seen.add(path);
        columns.push({ header: path, path });
      }
    }
  }

  for (const path of config.requiredPaths) {
    if (!seen.has(path)) {
      seen.add(path);
      columns.push({ header: path, path });
    }
  }

  return columns;
}

function xlsxColumnsForConfig(config: BulkUploadPreviewConfig): readonly BulkUploadXlsxColumn[] {
  return config.xlsxColumns ?? collectDefaultXlsxColumns(config);
}

function requiredXlsxHeaders(config: BulkUploadPreviewConfig): readonly string[] {
  if (config.xlsxRequiredHeaders) return config.xlsxRequiredHeaders;

  const columns = xlsxColumnsForConfig(config);
  return config.requiredPaths.map(
    (path) => columns.find((column) => column.path === path)?.header ?? path,
  );
}

function normalizeXlsxHeader(header: string): string {
  return header.trim().toLowerCase();
}

function xlsxPathForHeader(config: BulkUploadPreviewConfig, header: string): string | null {
  const normalizedHeader = normalizeXlsxHeader(header);
  if (!config.xlsxColumns) return normalizedHeader;

  return config.xlsxColumns.find((column) => normalizeXlsxHeader(column.header) === normalizedHeader)?.path ?? null;
}

function xlsxDateColumnsForConfig(config: BulkUploadPreviewConfig): readonly BulkUploadXlsxDateColumn[] {
  return config.xlsxDateColumns ?? [];
}

function usesJsonXlsxCells(config: BulkUploadPreviewConfig): boolean {
  return xlsxColumnsForConfig(config).some((column) => {
    const value = sampleValueForPath(config, column.path);
    return Array.isArray(value) || isRecord(value);
  });
}

function detectXlsxDateFormat(
  values: readonly XlsxDateColumnValue[],
  header: string,
): XlsxDateFormatDetection {
  const filledValues = values.filter(({ value }) => !valueIsEmpty(value));
  if (!filledValues.length) {
    return { ok: false, message: `XLSX column "${header}" does not contain any date values.` };
  }

  const textParts: ParsedDateTextParts[] = [];
  let hasDateCells = false;

  for (const { rowNumber, value } of filledValues) {
    if (value instanceof Date) {
      hasDateCells = true;
      continue;
    }

    if (typeof value !== 'string') {
      return { ok: false, message: `Row ${rowNumber} column "${header}" must be a date or date text.` };
    }

    const parts = parseDateTextParts(value.trim());
    if (!parts) {
      return {
        ok: false,
        message: `Row ${rowNumber} column "${header}" has an unsupported date format.`,
      };
    }
    textParts.push(parts);
  }

  if (hasDateCells && textParts.length) {
    return { ok: false, message: `XLSX column "${header}" has mixed date cell and text formats.` };
  }

  if (hasDateCells) {
    return { ok: true, format: { label: 'Excel date cells', order: 'date-cell' } };
  }

  return detectTextDateFormat(textParts, header);
}

function parseDateTextParts(value: string): ParsedDateTextParts | null {
  const ymd = /^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/.exec(value);
  if (ymd) {
    return {
      kind: 'ymd',
      separator: ymd[2] as '-' | '.' | '/',
      yearDigits: 4,
    };
  }

  const numeric = /^(\d{1,2})([-/.])(\d{1,2})\2(\d{2}|\d{4})$/.exec(value);
  if (!numeric) return null;

  return {
    first: Number(numeric[1]),
    kind: 'numeric',
    second: Number(numeric[3]),
    separator: numeric[2] as '-' | '.' | '/',
    yearDigits: numeric[4].length === 2 ? 2 : 4,
  };
}

function detectTextDateFormat(
  parts: readonly ParsedDateTextParts[],
  header: string,
): XlsxDateFormatDetection {
  const first = parts[0];
  if (!first) {
    return { ok: false, message: `XLSX column "${header}" does not contain any date values.` };
  }

  if (first.kind === 'ymd') {
    const hasMixedFormat = parts.some(
      (part) => part.kind !== 'ymd' || part.separator !== first.separator,
    );
    if (hasMixedFormat) {
      return { ok: false, message: `XLSX column "${header}" has mixed date formats.` };
    }

    return {
      ok: true,
      format: {
        label: `YYYY${first.separator}MM${first.separator}DD`,
        order: 'ymd',
        separator: first.separator,
        yearDigits: 4,
      },
    };
  }

  const numericParts = parts.filter(
    (part): part is Extract<ParsedDateTextParts, { kind: 'numeric' }> => part.kind === 'numeric',
  );
  if (numericParts.length !== parts.length) {
    return { ok: false, message: `XLSX column "${header}" has mixed date formats.` };
  }

  const hasMixedSeparator = numericParts.some((part) => part.separator !== first.separator);
  if (hasMixedSeparator) {
    return { ok: false, message: `XLSX column "${header}" has mixed date separators.` };
  }

  const yearDigits = numericParts.some((part) => part.yearDigits === 4) ? 4 : 2;
  const hasDayFirstEvidence = numericParts.some((part) => part.first > 12);
  const hasMonthFirstEvidence = numericParts.some((part) => part.second > 12);
  if (hasDayFirstEvidence && hasMonthFirstEvidence) {
    return { ok: false, message: `XLSX column "${header}" has mixed day/month ordering.` };
  }

  const order = hasMonthFirstEvidence ? 'mdy' : 'dmy';
  const separator = first.separator;
  const yearLabel = yearDigits === 2 ? 'YY' : 'YYYY';
  const label =
    order === 'mdy'
      ? `MM${separator}DD${separator}${yearLabel}`
      : `DD${separator}MM${separator}${yearLabel}`;

  return {
    ok: true,
    format: {
      label:
        !hasDayFirstEvidence && !hasMonthFirstEvidence
          ? `${label} (ambiguous values, assuming day first)`
          : label,
      order,
      separator,
      yearDigits,
    },
  };
}

function parseXlsxDateCell(
  value: unknown,
  format: DetectedXlsxDateFormat,
  rowNumber: number,
  header: string,
): XlsxCellParseResult {
  if (value instanceof Date) {
    return { ok: true, value: formatDateForPayload(value) };
  }

  if (typeof value !== 'string') {
    return { ok: false, message: `Row ${rowNumber} column "${header}" must be a date or date text.` };
  }

  const parsed = parseXlsxDateText(value.trim(), format);
  if (!parsed) {
    return {
      ok: false,
      message: `Row ${rowNumber} column "${header}" must match ${format.label}.`,
    };
  }

  return { ok: true, value: parsed };
}

function parseXlsxDateText(value: string, format: DetectedXlsxDateFormat): string | null {
  if (format.order === 'date-cell') return null;

  const separator = format.separator ?? '-';
  const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const yearPattern = format.yearDigits === 2 ? '\\d{2}' : '\\d{4}';
  const ymdPattern = new RegExp(`^(\\d{4})${escapedSeparator}(\\d{1,2})${escapedSeparator}(\\d{1,2})$`);
  const numericPattern = new RegExp(
    `^(\\d{1,2})${escapedSeparator}(\\d{1,2})${escapedSeparator}(${yearPattern})$`,
  );

  let year: number;
  let month: number;
  let day: number;

  if (format.order === 'ymd') {
    const match = ymdPattern.exec(value);
    if (!match) return null;
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    const match = numericPattern.exec(value);
    if (!match) return null;
    const first = Number(match[1]);
    const second = Number(match[2]);
    year = normalizeXlsxYear(Number(match[3]), match[3].length);
    month = format.order === 'mdy' ? first : second;
    day = format.order === 'mdy' ? second : first;
  }

  return formatDatePartsForPayload(year, month, day);
}

function normalizeXlsxYear(year: number, digits: number): number {
  if (digits !== 2) return year;
  return year >= 70 ? 1900 + year : 2000 + year;
}

function formatDatePartsForPayload(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

function valueIsEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() === '';
  return value === null || value === undefined;
}

function isMissingRequiredValue(value: unknown): boolean {
  return valueIsEmpty(value) || (Array.isArray(value) && value.length === 0);
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

function sampleValueForPath(config: BulkUploadPreviewConfig, path: string): unknown {
  const sample = config.sampleRows[0];
  return sample ? readPath(sample, path) : undefined;
}

function isNumericXlsxPath(path: string): boolean {
  const lastPart = path.split('.').at(-1)?.toLowerCase() ?? path.toLowerCase();
  return [
    'amount',
    'appliedto',
    'credit',
    'debit',
    'discount',
    'grandtotal',
    'itemtotal',
    'openingcr',
    'openingdr',
    'order',
    'price',
    'quantity',
    'rate',
    'roundoff',
    'subtotal',
    'tax',
    'taxamount',
  ].includes(lastPart);
}

function parseXlsxCellValue(
  value: unknown,
  config: BulkUploadPreviewConfig,
  path: string,
  rowNumber: number,
  header: string,
  dateFormat?: DetectedXlsxDateFormat,
): XlsxCellParseResult {
  if (valueIsEmpty(value)) return { ok: true, value: undefined };

  if (dateFormat) {
    return parseXlsxDateCell(value, dateFormat, rowNumber, header);
  }

  const sampleValue = sampleValueForPath(config, path);
  if (Array.isArray(sampleValue) || isRecord(sampleValue)) {
    if (typeof value !== 'string') {
      return { ok: false, message: `Row ${rowNumber} column "${header}" must contain JSON text.` };
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(sampleValue) && !Array.isArray(parsed)) {
        return { ok: false, message: `Row ${rowNumber} column "${header}" must contain a JSON array.` };
      }

      if (isRecord(sampleValue) && !isRecord(parsed)) {
        return { ok: false, message: `Row ${rowNumber} column "${header}" must contain a JSON object.` };
      }

      return { ok: true, value: parsed };
    } catch {
      return { ok: false, message: `Row ${rowNumber} column "${header}" must contain valid JSON.` };
    }
  }

  if (typeof sampleValue === 'number' || isNumericXlsxPath(path)) {
    const numericValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      return { ok: false, message: `Row ${rowNumber} column "${header}" must be a number.` };
    }

    return { ok: true, value: numericValue };
  }

  if (value instanceof Date) {
    return { ok: true, value: formatDateForPayload(value) };
  }

  if (typeof value === 'string') {
    return { ok: true, value: value.trim() };
  }

  if (typeof sampleValue === 'string') {
    return { ok: true, value: String(value).trim() };
  }

  return { ok: true, value };
}

function formatDateForPayload(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function sampleCellValue(value: unknown): unknown {
  if (Array.isArray(value) || isRecord(value)) {
    return JSON.stringify(value);
  }

  return value ?? '';
}

function safeFileName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'bulk-upload';
}

@Component({
  selector: 'app-bulk-upload-button',
  imports: [
    TngButtonComponent,
    TngDialogComponent,
    TngIcon,
    TngFileUploadDirective,
    TngPopover,
    TngPopoverPanel,
    TngPopoverTrigger,
    TngTable,
  ],
  templateUrl: './bulk-upload-button.component.html',
  styleUrl: './bulk-upload-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkUploadButtonComponent {
  private readonly bulkUploadService = inject(BulkUploadService);
  private readonly toastStore = inject(ToastStore);

  readonly accept = input(DEFAULT_ACCEPT);
  readonly disabled = input(false);
  readonly endpoint = input.required<string>();
  readonly config = input<BulkUploadPreviewConfig | null>(null);
  readonly label = input('Bulk upload');
  readonly maxSize = input(DEFAULT_MAX_SIZE);
  readonly uploaded = output<readonly unknown[]>();

  protected readonly isUploading = signal(false);
  protected readonly isPreviewOpen = signal(false);
  protected readonly isFormatErrorOpen = signal(false);
  protected readonly isInfoOpen = signal(false);
  protected readonly formatError = signal<string | null>(null);
  protected readonly pendingUpload = signal<BulkUploadPreview | null>(null);
  protected readonly isDisabled = computed(() => this.disabled() || this.isUploading());
  protected readonly hasSampleConfig = computed(() => this.previewConfig() !== null);
  protected readonly uploadInfo = computed<BulkUploadInfo | null>(() => {
    const config = this.previewConfig();
    if (!config) return null;

    return {
      modelName: config.modelName,
      requiredColumns: requiredXlsxHeaders(config),
      rootKey: config.rootKey,
      usesJsonXlsxCells: usesJsonXlsxCells(config),
      usesFieldPathHeaders: !config.xlsxColumns,
      xlsxHelpText: config.xlsxHelpText ?? null,
    };
  });

  protected chooseFile(input: HTMLInputElement): void {
    if (this.isDisabled()) return;
    input.click();
  }

  protected async onFileInputChange(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0] ?? null;
    inputElement.value = '';
    if (!file) return;

    await this.uploadFile(file);
  }

  protected async onFilesSelected(event: TngFileUploadSelectedEvent): Promise<void> {
    const file = event.files[0];
    if (!file) return;

    await this.uploadFile(file);
  }

  protected async onFilesRejected(event: TngFileUploadRejectedEvent): Promise<void> {
    const file = event.accepted[0];
    if (file) {
      await this.uploadFile(file);
      return;
    }

    const first = event.rejected[0];
    this.showFormatError(first?.message ?? 'Select one valid JSON or XLSX file to upload.');
  }

  private async uploadFile(file: File): Promise<void> {
    if (this.isDisabled()) return;

    this.clearFormatError();

    const fileError = this.validateFile(file);
    if (fileError) {
      this.showFormatError(fileError);
      return;
    }

    const preview = await this.preparePreview(file);
    if (typeof preview === 'string') {
      this.showFormatError(preview);
      return;
    }

    this.pendingUpload.set(preview);
    this.isPreviewOpen.set(true);
  }

  protected cancelPreview(): void {
    if (this.isUploading()) return;

    this.clearPreview();
  }

  protected onPreviewClosed(): void {
    if (!this.isUploading()) {
      this.clearPreview();
    }
  }

  protected onInfoOpenChange(open: boolean): void {
    this.isInfoOpen.set(open);
  }

  protected onFormatErrorClosed(): void {
    this.clearFormatError();
  }

  protected downloadSampleJson(): void {
    const config = this.previewConfig();
    if (!config) return;

    const payload = this.samplePayload(config);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `${safeFileName(config.modelName)}-sample.json`);
  }

  protected async downloadSampleXlsx(): Promise<void> {
    const config = this.previewConfig();
    if (!config) return;

    try {
      const xlsx = await import('xlsx');
      const columns = [...xlsxColumnsForConfig(config)];
      const headers = columns.map((column) => column.header);
      const sampleRows = config.xlsxSampleRows ?? config.sampleRows;
      const data: unknown[][] = [
        headers,
        ...sampleRows.map((row) =>
          columns.map((column) => sampleCellValue(readPath(row, column.path))),
        ),
      ];
      const worksheet = xlsx.utils.aoa_to_sheet(data);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, config.xlsxSheetName ?? 'Bulk Upload');
      const workbookBytes = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' }) as BlobPart;
      const blob = new Blob([workbookBytes], { type: XLSX_MIME_TYPE });
      this.downloadBlob(blob, `${safeFileName(config.modelName)}-sample.xlsx`);
    } catch {
      this.toastStore.danger('Unable to generate the sample XLSX file.');
    }
  }

  protected async confirmUpload(): Promise<void> {
    const pending = this.pendingUpload();
    if (!pending || this.isUploading()) return;

    this.isUploading.set(true);
    try {
      const created = await this.bulkUploadService.upload(this.endpoint(), pending.uploadFile);
      this.toastStore.success(this.successMessage(created));
      this.uploaded.emit(created);
      this.clearPreview();
    } catch (error) {
      this.toastStore.danger(getApiErrorMessage(error, 'Bulk upload failed.'));
    } finally {
      this.isUploading.set(false);
    }
  }

  private validateFile(file: File): string | null {
    if (file.size <= 0) {
      return 'Select a non-empty JSON or XLSX file.';
    }

    if (file.size > this.maxSize()) {
      return `Select a JSON or XLSX file smaller than ${this.formatFileSize(this.maxSize())}.`;
    }

    if (!this.isAcceptedFile(file)) {
      return 'Select a JSON or XLSX file.';
    }

    return null;
  }

  private async preparePreview(file: File): Promise<BulkUploadPreview | string> {
    const config = this.previewConfig();
    if (!config) {
      return 'Bulk upload preview is not configured for this model.';
    }

    const readResult = await this.readPayload(file, config);
    if (typeof readResult === 'string') {
      return readResult;
    }

    const rows = this.validatePayloadRows(readResult.payload, config);
    if (typeof rows === 'string') {
      return rows;
    }

    return {
      columns: config.columns,
      details: readResult.previewDetails ?? [],
      file,
      fileSize: this.formatFileSize(file.size),
      modelName: config.modelName,
      rowCount: rows.length,
      rootKey: config.rootKey,
      rootKeys: Object.keys(readResult.payload),
      rows,
      uploadFile: this.toUploadFile(file, readResult.payload),
    };
  }

  private async readPayload(file: File, config: BulkUploadPreviewConfig): Promise<BulkUploadReadResult | string> {
    const format = this.fileFormat(file);
    if (format === 'xlsx') {
      return this.readXlsxPayload(file, config);
    }

    return this.readJsonPayload(file);
  }

  private async readJsonPayload(file: File): Promise<BulkUploadReadResult | string> {
    let content: string;
    try {
      content = await file.text();
    } catch {
      return 'Unable to read the selected file.';
    }

    try {
      const parsed = JSON.parse(content) as unknown;
      if (!isRecord(parsed)) {
        return 'Bulk upload JSON root must be an object.';
      }

      return { payload: parsed };
    } catch {
      return 'File must contain valid JSON.';
    }
  }

  private async readXlsxPayload(file: File, config: BulkUploadPreviewConfig): Promise<BulkUploadReadResult | string> {
    let rows: unknown[][];
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(await file.arrayBuffer(), { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return 'XLSX file does not contain any sheets.';
      }

      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return 'Unable to read the first sheet in the XLSX file.';
      }

      rows = xlsx.utils.sheet_to_json<unknown[]>(worksheet, {
        defval: '',
        header: 1,
        raw: true,
      }) as unknown[][];
    } catch {
      return 'Unable to read the XLSX file. Download the sample XLSX and keep the header row format unchanged.';
    }

    const headerIndex = rows.findIndex((row) => Array.isArray(row) && row.some((value) => !valueIsEmpty(value)));
    if (headerIndex < 0) {
      return 'XLSX file is empty. Download the sample XLSX and add records below the header row.';
    }

    const headers = rows[headerIndex].map((cell) => String(cell ?? '').trim());
    const nonEmptyHeaders = headers.filter((header) => header);
    if (!nonEmptyHeaders.length) {
      return 'XLSX header row is empty. Download the sample XLSX and keep the header row unchanged.';
    }

    const normalizedHeaders = nonEmptyHeaders.map(normalizeXlsxHeader);
    const duplicateHeaders = nonEmptyHeaders.filter(
      (_header, index) => normalizedHeaders.indexOf(normalizedHeaders[index]) !== index,
    );
    if (duplicateHeaders.length) {
      return `XLSX has duplicate columns: ${[...new Set(duplicateHeaders)].join(', ')}.`;
    }

    const headerSet = new Set(normalizedHeaders);
    const missingHeaders = requiredXlsxHeaders(config).filter(
      (header) => !headerSet.has(normalizeXlsxHeader(header)),
    );
    if (missingHeaders.length) {
      return `XLSX is missing required columns: ${missingHeaders.join(', ')}. Download the sample XLSX and keep the header row unchanged.`;
    }

    const dateFormatByPath = new Map<string, DetectedXlsxDateFormat>();
    const previewDetails: BulkUploadPreviewDetail[] = [];
    const dataRows = rows.slice(headerIndex + 1);

    for (const dateColumn of xlsxDateColumnsForConfig(config)) {
      const columnIndex = headers.findIndex(
        (header) => normalizeXlsxHeader(header) === normalizeXlsxHeader(dateColumn.header),
      );
      if (columnIndex < 0) continue;

      const values = dataRows
        .map((row, dataIndex) => ({
          rowNumber: headerIndex + dataIndex + 2,
          value: Array.isArray(row) ? row[columnIndex] : undefined,
        }))
        .filter(({ value }) => !valueIsEmpty(value));
      const detected = detectXlsxDateFormat(values, dateColumn.header);
      if (!detected.ok) return detected.message;

      dateFormatByPath.set(dateColumn.path, detected.format);
      previewDetails.push({
        label: dateColumn.label ?? `${dateColumn.header} format`,
        value: detected.format.label,
      });
    }

    const parsedRows: BulkUploadXlsxParsedRow[] = [];

    for (const [dataIndex, row] of dataRows.entries()) {
      if (!Array.isArray(row) || row.every(valueIsEmpty)) continue;

      const outputRow: BulkUploadPreviewRow = {};
      const spreadsheetRowNumber = headerIndex + dataIndex + 2;

      for (const [columnIndex, header] of headers.entries()) {
        if (!header) continue;

        const path = xlsxPathForHeader(config, header);
        if (!path) continue;

        const parsed = parseXlsxCellValue(
          row[columnIndex],
          config,
          path,
          spreadsheetRowNumber,
          header,
          dateFormatByPath.get(path),
        );
        if (!parsed.ok) {
          return parsed.message;
        }

        if (!valueIsEmpty(parsed.value)) {
          setPath(outputRow, path, parsed.value);
        }
      }

      parsedRows.push({ row: outputRow, rowNumber: spreadsheetRowNumber });
    }

    if (!parsedRows.length) {
      return 'XLSX does not contain any data rows. Add records below the header row.';
    }

    if (config.xlsxRowsToPayloadRows) {
      const payloadRows = config.xlsxRowsToPayloadRows(parsedRows);
      if (typeof payloadRows === 'string') return payloadRows;

      return { payload: { [config.rootKey]: payloadRows }, previewDetails };
    }

    const payloadRows: BulkUploadPreviewRow[] = [];
    for (const { row, rowNumber } of parsedRows) {
      const missingValues = config.requiredPaths.filter((path) =>
        isMissingRequiredValue(readPath(row, path)),
      );
      if (missingValues.length) {
        return `Row ${rowNumber} is missing required values: ${missingValues.join(', ')}.`;
      }

      payloadRows.push(row);
    }

    return { payload: { [config.rootKey]: payloadRows }, previewDetails };
  }

  private validatePayloadRows(
    payload: BulkUploadPayload,
    config: BulkUploadPreviewConfig,
  ): readonly BulkUploadPreviewRow[] | string {
    const rows = payload[config.rootKey];
    if (!Array.isArray(rows)) {
      return `Bulk upload file must contain a "${config.rootKey}" array.`;
    }

    if (!rows.length) {
      return `The "${config.rootKey}" array must contain at least one record.`;
    }

    if (!rows.every(isRecord)) {
      return `Every item in "${config.rootKey}" must be an object.`;
    }

    const previewRows = rows as BulkUploadPreviewRow[];
    const firstInvalidIndex = previewRows.findIndex((row) =>
      config.requiredPaths.some((path) => isMissingRequiredValue(readPath(row, path))),
    );
    if (firstInvalidIndex >= 0) {
      const missingValues = config.requiredPaths.filter((path) =>
        isMissingRequiredValue(readPath(previewRows[firstInvalidIndex], path)),
      );
      return `Record ${firstInvalidIndex + 1} is missing required values: ${missingValues.join(', ')}.`;
    }

    return previewRows;
  }

  private previewConfig(): BulkUploadPreviewConfig | null {
    return this.config() ?? BULK_UPLOAD_PREVIEW_CONFIGS[normalizeEndpointPath(this.endpoint())] ?? null;
  }

  private isAcceptedFile(file: File): boolean {
    return this.fileFormat(file) !== null;
  }

  private fileFormat(file: File): BulkUploadFormat | null {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.xlsx') || ACCEPTED_XLSX_MIME_TYPES.has(file.type)) {
      return 'xlsx';
    }

    if (lowerName.endsWith('.json') || ACCEPTED_MIME_TYPES.has(file.type)) {
      return 'json';
    }

    return null;
  }

  private toUploadFile(file: File, payload: BulkUploadPayload): File {
    const fileName = `${file.name.replace(/\.[^.]+$/, '') || 'bulk-upload'}.json`;
    return new File([JSON.stringify(payload)], fileName, {
      lastModified: Date.now(),
      type: 'application/json',
    });
  }

  private samplePayload(config: BulkUploadPreviewConfig): BulkUploadPayload {
    return { [config.rootKey]: config.sampleRows };
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url));
  }

  private clearPreview(): void {
    this.isPreviewOpen.set(false);
    this.pendingUpload.set(null);
  }

  private showFormatError(message: string): void {
    this.clearPreview();
    this.formatError.set(message);
    this.isFormatErrorOpen.set(true);
  }

  private clearFormatError(): void {
    this.isFormatErrorOpen.set(false);
    this.formatError.set(null);
  }

  private successMessage(created: readonly unknown[]): string {
    const count = Array.isArray(created) ? created.length : 0;
    return count > 0
      ? `Bulk upload completed. ${count} record${count === 1 ? '' : 's'} created.`
      : 'Bulk upload completed.';
  }

  private formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'] as const;
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${
      units[unitIndex]
    }`;
  }
}
