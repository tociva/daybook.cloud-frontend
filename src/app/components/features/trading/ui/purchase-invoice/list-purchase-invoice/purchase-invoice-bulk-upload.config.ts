import {
  bulkUploadCountColumn,
  bulkUploadNumberColumn,
  bulkUploadTextColumn,
  readBulkUploadPath,
  type BulkUploadPreviewConfig,
  type BulkUploadPreviewRow,
  type BulkUploadXlsxColumn,
  type BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';

type BulkUploadField = Readonly<{
  label: string;
  outputPath?: string;
  sourcePath: string;
}>;

const PURCHASE_INVOICE_XLSX_COLUMNS: readonly BulkUploadXlsxColumn[] = [
  { header: 'Invoice Number', path: 'number' },
  { header: 'Date', path: 'date' },
  { header: 'Due Date', path: 'duedate' },
  { header: 'Vendor Name', path: 'vendorname' },
  { header: 'Currency Code', path: 'currencycode' },
  { header: 'Description', path: 'description' },
  { header: 'Tax Option', path: 'taxoption' },
  { header: 'Vendor Address Name', path: 'vendoraddress.name' },
  { header: 'Vendor Address Line 1', path: 'vendoraddress.line1' },
  { header: 'Vendor Address Line 2', path: 'vendoraddress.line2' },
  { header: 'Vendor Street', path: 'vendoraddress.street' },
  { header: 'Vendor City', path: 'vendoraddress.city' },
  { header: 'Vendor State', path: 'vendoraddress.state' },
  { header: 'Vendor Zip', path: 'vendoraddress.zip' },
  { header: 'Vendor Country', path: 'vendoraddress.country' },
  { header: 'Vendor Mobile', path: 'vendoraddress.mobile' },
  { header: 'Vendor Email', path: 'vendoraddress.email' },
  { header: 'Invoice Item Total', path: 'itemtotal' },
  { header: 'Invoice Discount', path: 'discount' },
  { header: 'Invoice Subtotal', path: 'subtotal' },
  { header: 'Invoice Tax', path: 'tax' },
  { header: 'Invoice Roundoff', path: 'roundoff' },
  { header: 'Invoice Grand Total', path: 'grandtotal' },
  { header: 'Item Name', path: 'item.name' },
  { header: 'Item Display Name', path: 'item.displayname' },
  { header: 'Item Description', path: 'item.description' },
  { header: 'Item Order', path: 'item.order' },
  { header: 'Item Code', path: 'item.code' },
  { header: 'Item Price', path: 'item.price' },
  { header: 'Item Quantity', path: 'item.quantity' },
  { header: 'Item Total', path: 'item.itemtotal' },
  { header: 'Item Discount Percent', path: 'item.discpercent' },
  { header: 'Item Discount Amount', path: 'item.discamount' },
  { header: 'Item Subtotal', path: 'item.subtotal' },
  { header: 'Item Tax Amount', path: 'item.taxamount' },
  { header: 'Item Grand Total', path: 'item.grandtotal' },
  { header: 'Tax Name', path: 'itemtax.name' },
  { header: 'Tax Short Name', path: 'itemtax.shortname' },
  { header: 'Tax Rate', path: 'itemtax.rate' },
  { header: 'Tax Applied To', path: 'itemtax.appliedto' },
  { header: 'Tax Amount', path: 'itemtax.amount' },
];

const INVOICE_FIELDS: readonly BulkUploadField[] = [
  { label: 'Invoice Number', sourcePath: 'number' },
  { label: 'Date', sourcePath: 'date' },
  { label: 'Due Date', sourcePath: 'duedate' },
  { label: 'Vendor Name', sourcePath: 'vendorname' },
  { label: 'Currency Code', sourcePath: 'currencycode' },
  { label: 'Description', sourcePath: 'description' },
  { label: 'Tax Option', sourcePath: 'taxoption' },
  { label: 'Vendor Address Name', sourcePath: 'vendoraddress.name' },
  { label: 'Vendor Address Line 1', sourcePath: 'vendoraddress.line1' },
  { label: 'Vendor Address Line 2', sourcePath: 'vendoraddress.line2' },
  { label: 'Vendor Street', sourcePath: 'vendoraddress.street' },
  { label: 'Vendor City', sourcePath: 'vendoraddress.city' },
  { label: 'Vendor State', sourcePath: 'vendoraddress.state' },
  { label: 'Vendor Zip', sourcePath: 'vendoraddress.zip' },
  { label: 'Vendor Country', sourcePath: 'vendoraddress.country' },
  { label: 'Vendor Mobile', sourcePath: 'vendoraddress.mobile' },
  { label: 'Vendor Email', sourcePath: 'vendoraddress.email' },
  { label: 'Invoice Item Total', sourcePath: 'itemtotal' },
  { label: 'Invoice Discount', sourcePath: 'discount' },
  { label: 'Invoice Subtotal', sourcePath: 'subtotal' },
  { label: 'Invoice Tax', sourcePath: 'tax' },
  { label: 'Invoice Roundoff', sourcePath: 'roundoff' },
  { label: 'Invoice Grand Total', sourcePath: 'grandtotal' },
];

const INVOICE_REQUIRED_FIELDS: readonly BulkUploadField[] = [
  { label: 'Invoice Number', sourcePath: 'number' },
  { label: 'Date', sourcePath: 'date' },
  { label: 'Due Date', sourcePath: 'duedate' },
  { label: 'Vendor Name', sourcePath: 'vendorname' },
  { label: 'Invoice Item Total', sourcePath: 'itemtotal' },
  { label: 'Invoice Subtotal', sourcePath: 'subtotal' },
  { label: 'Invoice Grand Total', sourcePath: 'grandtotal' },
];

const ITEM_FIELDS: readonly BulkUploadField[] = [
  { label: 'Item Name', outputPath: 'name', sourcePath: 'item.name' },
  { label: 'Item Display Name', outputPath: 'displayname', sourcePath: 'item.displayname' },
  { label: 'Item Description', outputPath: 'description', sourcePath: 'item.description' },
  { label: 'Item Order', outputPath: 'order', sourcePath: 'item.order' },
  { label: 'Item Code', outputPath: 'code', sourcePath: 'item.code' },
  { label: 'Item Price', outputPath: 'price', sourcePath: 'item.price' },
  { label: 'Item Quantity', outputPath: 'quantity', sourcePath: 'item.quantity' },
  { label: 'Item Total', outputPath: 'itemtotal', sourcePath: 'item.itemtotal' },
  { label: 'Item Discount Percent', outputPath: 'discpercent', sourcePath: 'item.discpercent' },
  { label: 'Item Discount Amount', outputPath: 'discamount', sourcePath: 'item.discamount' },
  { label: 'Item Subtotal', outputPath: 'subtotal', sourcePath: 'item.subtotal' },
  { label: 'Item Tax Amount', outputPath: 'taxamount', sourcePath: 'item.taxamount' },
  { label: 'Item Grand Total', outputPath: 'grandtotal', sourcePath: 'item.grandtotal' },
];

const ITEM_REQUIRED_FIELDS: readonly BulkUploadField[] = [
  { label: 'Item Name', sourcePath: 'item.name' },
  { label: 'Item Display Name', sourcePath: 'item.displayname' },
  { label: 'Item Order', sourcePath: 'item.order' },
  { label: 'Item Code', sourcePath: 'item.code' },
  { label: 'Item Price', sourcePath: 'item.price' },
  { label: 'Item Quantity', sourcePath: 'item.quantity' },
  { label: 'Item Total', sourcePath: 'item.itemtotal' },
  { label: 'Item Subtotal', sourcePath: 'item.subtotal' },
  { label: 'Item Grand Total', sourcePath: 'item.grandtotal' },
];

const TAX_FIELDS: readonly BulkUploadField[] = [
  { label: 'Tax Name', outputPath: 'name', sourcePath: 'itemtax.name' },
  { label: 'Tax Short Name', outputPath: 'shortname', sourcePath: 'itemtax.shortname' },
  { label: 'Tax Rate', outputPath: 'rate', sourcePath: 'itemtax.rate' },
  { label: 'Tax Applied To', outputPath: 'appliedto', sourcePath: 'itemtax.appliedto' },
  { label: 'Tax Amount', outputPath: 'amount', sourcePath: 'itemtax.amount' },
];

const REQUIRED_PURCHASE_INVOICE_JSON_PATHS = [
  'number',
  'date',
  'duedate',
  'vendorname',
  'itemtotal',
  'subtotal',
  'grandtotal',
  'items',
] as const;

const OPTIONAL_XLSX_PATH_PREFIXES = ['vendoraddress.'] as const;

const PURCHASE_INVOICE_XLSX_REQUIRED_HEADERS = PURCHASE_INVOICE_XLSX_COLUMNS.filter(
  (column) => !OPTIONAL_XLSX_PATH_PREFIXES.some((prefix) => column.path.startsWith(prefix)),
).map((column) => column.header);

const SAMPLE_VENDOR_ADDRESS = {
  name: 'Acme Supplies',
  line1: 'Plot 42',
  line2: '',
  street: 'Industrial Layout',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560100',
  country: 'India',
  mobile: '+91 9876500001',
  email: 'orders@acmesupplies.example',
};

export const PURCHASE_INVOICE_BULK_UPLOAD_CONFIG: BulkUploadPreviewConfig = {
  modelName: 'Purchase Invoices',
  requiredPaths: REQUIRED_PURCHASE_INVOICE_JSON_PATHS,
  rootKey: 'invoices',
  sampleRows: [
    {
      number: 'PI-001',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      vendorname: 'Acme Supplies',
      vendoraddress: SAMPLE_VENDOR_ADDRESS,
      description: 'Business laptop purchase',
      taxoption: 'Intra State',
      itemtotal: 10000,
      discount: 0,
      subtotal: 10000,
      tax: 1800,
      roundoff: 0,
      grandtotal: 11800,
      items: [
        {
          name: 'Laptop',
          displayname: 'Laptop',
          description: 'HP laptop with Intel i5 processor',
          order: 1,
          code: '8471',
          price: 10000,
          quantity: 1,
          itemtotal: 10000,
          discpercent: 0,
          discamount: 0,
          subtotal: 10000,
          taxamount: 1800,
          grandtotal: 11800,
          taxes: [
            { name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 100, amount: 900 },
            { name: 'SGST 9%', shortname: 'SGST', rate: 9, appliedto: 100, amount: 900 },
          ],
        },
      ],
    },
  ],
  xlsxColumns: PURCHASE_INVOICE_XLSX_COLUMNS,
  xlsxDateColumns: [
    { header: 'Date', path: 'date', label: 'Invoice date format' },
    { header: 'Due Date', path: 'duedate', label: 'Due date format' },
  ],
  xlsxHelpText:
    'Use one row per invoice item or tax line. Put invoice fields on the first row for an invoice, include vendor address fields only when overriding the saved vendor address, put item fields on the first row for an item, and leave invoice/item columns blank on continuation tax rows.',
  xlsxRequiredHeaders: PURCHASE_INVOICE_XLSX_REQUIRED_HEADERS,
  xlsxRowsToPayloadRows: purchaseInvoiceXlsxRowsToPayloadRows,
  xlsxSampleRows: [
    {
      number: 'PI-001',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      vendorname: 'Acme Supplies',
      vendoraddress: SAMPLE_VENDOR_ADDRESS,
      description: 'Business laptop purchase',
      taxoption: 'Intra State',
      itemtotal: 10000,
      discount: 0,
      subtotal: 10000,
      tax: 1800,
      roundoff: 0,
      grandtotal: 11800,
      item: {
        name: 'Laptop',
        displayname: 'Laptop',
        description: 'HP laptop with Intel i5 processor',
        order: 1,
        code: '8471',
        price: 10000,
        quantity: 1,
        itemtotal: 10000,
        discpercent: 0,
        discamount: 0,
        subtotal: 10000,
        taxamount: 1800,
        grandtotal: 11800,
      },
      itemtax: { name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 100, amount: 900 },
    },
    {
      itemtax: { name: 'SGST 9%', shortname: 'SGST', rate: 9, appliedto: 100, amount: 900 },
    },
  ],
  xlsxSheetName: 'Purchase Invoices',
  columns: [
    bulkUploadTextColumn('number', 'Number', 'number', '10rem'),
    bulkUploadTextColumn('date', 'Date', 'date', '9rem'),
    bulkUploadTextColumn('vendorname', 'Vendor', 'vendorname', '14rem'),
    bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    bulkUploadCountColumn('items', 'Items', 'items', '7rem'),
    bulkUploadNumberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
    bulkUploadNumberColumn('tax', 'Tax', 'tax', '9rem'),
    bulkUploadNumberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
  ],
};

export function purchaseInvoiceXlsxRowsToPayloadRows(
  parsedRows: readonly BulkUploadXlsxParsedRow[],
): readonly BulkUploadPreviewRow[] | string {
  const invoices: BulkUploadPreviewRow[] = [];
  let currentInvoice: BulkUploadPreviewRow | null = null;
  let currentInvoiceStartRow = 0;
  let currentItem: BulkUploadPreviewRow | null = null;
  let currentItemStartRow = 0;

  for (const { row, rowNumber } of parsedRows) {
    const startsInvoice = !valueIsEmpty(readPath(row, 'number'));
    const startsItem = !valueIsEmpty(readPath(row, 'item.name'));
    const hasInvoiceValues = hasAnyValue(row, INVOICE_FIELDS);
    const hasItemValues = hasAnyValue(row, ITEM_FIELDS);
    const hasTaxValues = hasAnyValue(row, TAX_FIELDS);

    if (startsInvoice) {
      const previousItemError = validatePurchaseInvoiceXlsxItem(currentItem, currentItemStartRow);
      if (previousItemError) return previousItemError;

      currentInvoice = createPurchaseInvoiceFromXlsxRow(row);
      currentInvoiceStartRow = rowNumber;
      currentItem = null;
      currentItemStartRow = 0;
      invoices.push(currentInvoice);

      const invoiceMissing = missingRequiredLabels(row, INVOICE_REQUIRED_FIELDS);
      if (invoiceMissing.length) {
        return `Invoice starting at row ${rowNumber} is missing required values: ${invoiceMissing.join(', ')}.`;
      }

      if (!startsItem) {
        return `Invoice starting at row ${rowNumber} must include Item Name on its first row.`;
      }
    } else if (hasInvoiceValues) {
      return `Row ${rowNumber} has invoice values but no Invoice Number. Put invoice fields only on the first row for each invoice.`;
    } else if (!currentInvoice) {
      if (hasTaxValues && !hasItemValues) {
        return `Row ${rowNumber} has tax values before an invoice item. Start an invoice and item before adding tax rows.`;
      }

      return `Row ${rowNumber} must start an invoice with Invoice Number before adding item or tax rows.`;
    }

    if (startsItem) {
      const previousItemError = validatePurchaseInvoiceXlsxItem(currentItem, currentItemStartRow);
      if (previousItemError) return previousItemError;

      const itemMissing = missingRequiredLabels(row, ITEM_REQUIRED_FIELDS);
      if (itemMissing.length) {
        return `Item starting at row ${rowNumber} is missing required values: ${itemMissing.join(', ')}.`;
      }

      currentItem = createPurchaseInvoiceItemFromXlsxRow(row);
      currentItemStartRow = rowNumber;
      (currentInvoice['items'] as BulkUploadPreviewRow[]).push(currentItem);
    } else if (
      hasAnyValue(
        row,
        ITEM_FIELDS.filter((field) => field.sourcePath !== 'item.name'),
      )
    ) {
      return `Row ${rowNumber} has item values but no Item Name. Put Item Name on the first row for each item.`;
    } else if (!currentItem) {
      if (hasTaxValues) {
        return `Row ${rowNumber} has tax values before an invoice item. Add Item Name before adding tax rows.`;
      }

      return `Row ${rowNumber} must include Item Name before adding item or tax values.`;
    }

    if (hasTaxValues) {
      const taxMissing = missingRequiredLabels(row, TAX_FIELDS);
      if (taxMissing.length) {
        return `Tax row ${rowNumber} is missing required values: ${taxMissing.join(', ')}.`;
      }

      appendTaxToItem(currentItem, createPurchaseInvoiceTaxFromXlsxRow(row));
    }

    const currentInvoiceError = validatePurchaseInvoiceXlsxInvoice(
      currentInvoice,
      currentInvoiceStartRow,
    );
    if (currentInvoiceError) return currentInvoiceError;
  }

  const finalItemError = validatePurchaseInvoiceXlsxItem(currentItem, currentItemStartRow);
  if (finalItemError) return finalItemError;

  const finalInvoiceError = validatePurchaseInvoiceXlsxInvoice(
    currentInvoice,
    currentInvoiceStartRow,
  );
  if (finalInvoiceError) return finalInvoiceError;

  return invoices;
}

function createPurchaseInvoiceFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return {
    ...copyFields(row, INVOICE_FIELDS),
    items: [],
  };
}

function createPurchaseInvoiceItemFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return copyFields(row, ITEM_FIELDS);
}

function createPurchaseInvoiceTaxFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return copyFields(row, TAX_FIELDS);
}

function appendTaxToItem(item: BulkUploadPreviewRow, tax: BulkUploadPreviewRow): void {
  const taxes = item['taxes'];
  if (Array.isArray(taxes)) {
    taxes.push(tax);
    return;
  }

  item['taxes'] = [tax];
}

function validatePurchaseInvoiceXlsxInvoice(
  invoice: BulkUploadPreviewRow | null,
  rowNumber: number,
): string | null {
  if (!invoice) return null;

  const items = invoice['items'];
  if (!Array.isArray(items) || !items.length) {
    return `Invoice starting at row ${rowNumber} must include at least one item.`;
  }

  return null;
}

function validatePurchaseInvoiceXlsxItem(
  item: BulkUploadPreviewRow | null,
  rowNumber: number,
): string | null {
  if (!item) return null;

  const taxes = item['taxes'];
  if (Array.isArray(taxes) && taxes.length && valueIsEmpty(item['taxamount'])) {
    return `Item starting at row ${rowNumber} has taxes and must include Item Tax Amount.`;
  }

  return null;
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
