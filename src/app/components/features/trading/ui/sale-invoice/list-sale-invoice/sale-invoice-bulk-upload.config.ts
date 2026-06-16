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

const SALE_INVOICE_XLSX_COLUMNS: readonly BulkUploadXlsxColumn[] = [
  { header: 'Invoice Number', path: 'number' },
  { header: 'Date', path: 'date' },
  { header: 'Due Date', path: 'duedate' },
  { header: 'Customer Name', path: 'customername' },
  { header: 'Currency Code', path: 'currencycode' },
  { header: 'Description', path: 'description' },
  { header: 'Tax Option', path: 'taxoption' },
  { header: 'Delivery State', path: 'deliverystate' },
  { header: 'Billing Address Name', path: 'billingaddress.name' },
  { header: 'Billing Address Line 1', path: 'billingaddress.line1' },
  { header: 'Billing Address Line 2', path: 'billingaddress.line2' },
  { header: 'Billing Street', path: 'billingaddress.street' },
  { header: 'Billing City', path: 'billingaddress.city' },
  { header: 'Billing State', path: 'billingaddress.state' },
  { header: 'Billing Zip', path: 'billingaddress.zip' },
  { header: 'Billing Country', path: 'billingaddress.country' },
  { header: 'Billing Mobile', path: 'billingaddress.mobile' },
  { header: 'Billing Email', path: 'billingaddress.email' },
  { header: 'Shipping Address Name', path: 'shippingaddress.name' },
  { header: 'Shipping Address Line 1', path: 'shippingaddress.line1' },
  { header: 'Shipping Address Line 2', path: 'shippingaddress.line2' },
  { header: 'Shipping Street', path: 'shippingaddress.street' },
  { header: 'Shipping City', path: 'shippingaddress.city' },
  { header: 'Shipping State', path: 'shippingaddress.state' },
  { header: 'Shipping Zip', path: 'shippingaddress.zip' },
  { header: 'Shipping Country', path: 'shippingaddress.country' },
  { header: 'Shipping Mobile', path: 'shippingaddress.mobile' },
  { header: 'Shipping Email', path: 'shippingaddress.email' },
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
  { label: 'Customer Name', sourcePath: 'customername' },
  { label: 'Currency Code', sourcePath: 'currencycode' },
  { label: 'Description', sourcePath: 'description' },
  { label: 'Tax Option', sourcePath: 'taxoption' },
  { label: 'Delivery State', sourcePath: 'deliverystate' },
  { label: 'Billing Address Name', sourcePath: 'billingaddress.name' },
  { label: 'Billing Address Line 1', sourcePath: 'billingaddress.line1' },
  { label: 'Billing Address Line 2', sourcePath: 'billingaddress.line2' },
  { label: 'Billing Street', sourcePath: 'billingaddress.street' },
  { label: 'Billing City', sourcePath: 'billingaddress.city' },
  { label: 'Billing State', sourcePath: 'billingaddress.state' },
  { label: 'Billing Zip', sourcePath: 'billingaddress.zip' },
  { label: 'Billing Country', sourcePath: 'billingaddress.country' },
  { label: 'Billing Mobile', sourcePath: 'billingaddress.mobile' },
  { label: 'Billing Email', sourcePath: 'billingaddress.email' },
  { label: 'Shipping Address Name', sourcePath: 'shippingaddress.name' },
  { label: 'Shipping Address Line 1', sourcePath: 'shippingaddress.line1' },
  { label: 'Shipping Address Line 2', sourcePath: 'shippingaddress.line2' },
  { label: 'Shipping Street', sourcePath: 'shippingaddress.street' },
  { label: 'Shipping City', sourcePath: 'shippingaddress.city' },
  { label: 'Shipping State', sourcePath: 'shippingaddress.state' },
  { label: 'Shipping Zip', sourcePath: 'shippingaddress.zip' },
  { label: 'Shipping Country', sourcePath: 'shippingaddress.country' },
  { label: 'Shipping Mobile', sourcePath: 'shippingaddress.mobile' },
  { label: 'Shipping Email', sourcePath: 'shippingaddress.email' },
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
  { label: 'Customer Name', sourcePath: 'customername' },
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

const REQUIRED_SALE_INVOICE_JSON_PATHS = [
  'number',
  'date',
  'duedate',
  'customername',
  'itemtotal',
  'subtotal',
  'grandtotal',
  'items',
] as const;

const OPTIONAL_XLSX_PATH_PREFIXES = ['billingaddress.', 'shippingaddress.'] as const;

const SALE_INVOICE_XLSX_REQUIRED_HEADERS = SALE_INVOICE_XLSX_COLUMNS.filter(
  (column) =>
    !OPTIONAL_XLSX_PATH_PREFIXES.some((prefix) => column.path.startsWith(prefix)),
).map((column) => column.header);

const SAMPLE_BILLING_ADDRESS = {
  name: 'Acme Retail',
  line1: 'Plot 10',
  line2: '',
  street: 'MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560001',
  country: 'India',
  mobile: '+91 9876543210',
  email: 'billing@acme.example',
};

const SAMPLE_SHIPPING_ADDRESS = {
  name: 'Acme Retail Warehouse',
  line1: 'Warehouse 4',
  line2: '',
  street: 'Peenya Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560058',
  country: 'India',
  mobile: '+91 9876543211',
  email: 'warehouse@acme.example',
};

export const SALE_INVOICE_BULK_UPLOAD_CONFIG: BulkUploadPreviewConfig = {
  modelName: 'Sale Invoices',
  requiredPaths: REQUIRED_SALE_INVOICE_JSON_PATHS,
  rootKey: 'invoices',
  sampleRows: [
    {
      number: 'SI-001',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      customername: 'Acme Retail',
      billingaddress: SAMPLE_BILLING_ADDRESS,
      shippingaddress: SAMPLE_SHIPPING_ADDRESS,
      description: 'Laptop sale',
      deliverystate: 'Karnataka',
      taxoption: 'exclusive',
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
  xlsxColumns: SALE_INVOICE_XLSX_COLUMNS,
  xlsxDateColumns: [
    { header: 'Date', path: 'date', label: 'Invoice date format' },
    { header: 'Due Date', path: 'duedate', label: 'Due date format' },
  ],
  xlsxHelpText:
    'Use one row per invoice item or tax line. Put invoice fields on the first row for an invoice, item fields on the first row for an item, and leave invoice/item columns blank on continuation tax rows.',
  xlsxRequiredHeaders: SALE_INVOICE_XLSX_REQUIRED_HEADERS,
  xlsxRowsToPayloadRows: saleInvoiceXlsxRowsToPayloadRows,
  xlsxSampleRows: [
    {
      number: 'SI-001',
      date: '2026-04-01',
      duedate: '2026-04-15',
      currencycode: 'INR',
      customername: 'Acme Retail',
      description: 'Laptop sale',
      deliverystate: 'Karnataka',
      taxoption: 'exclusive',
      billingaddress: SAMPLE_BILLING_ADDRESS,
      shippingaddress: SAMPLE_SHIPPING_ADDRESS,
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
  xlsxSheetName: 'Sale Invoices',
  columns: [
    bulkUploadTextColumn('number', 'Number', 'number', '10rem'),
    bulkUploadTextColumn('date', 'Date', 'date', '9rem'),
    bulkUploadTextColumn('customername', 'Customer', 'customername', '14rem'),
    bulkUploadTextColumn('currencycode', 'Currency', 'currencycode', '8rem'),
    bulkUploadCountColumn('items', 'Items', 'items', '7rem'),
    bulkUploadNumberColumn('subtotal', 'Subtotal', 'subtotal', '9rem'),
    bulkUploadNumberColumn('tax', 'Tax', 'tax', '9rem'),
    bulkUploadNumberColumn('grandtotal', 'Grand total', 'grandtotal', '10rem'),
  ],
};

export function saleInvoiceXlsxRowsToPayloadRows(
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
      const previousItemError = validateSaleInvoiceXlsxItem(currentItem, currentItemStartRow);
      if (previousItemError) return previousItemError;

      currentInvoice = createSaleInvoiceFromXlsxRow(row);
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
      const previousItemError = validateSaleInvoiceXlsxItem(currentItem, currentItemStartRow);
      if (previousItemError) return previousItemError;

      const itemMissing = missingRequiredLabels(row, ITEM_REQUIRED_FIELDS);
      if (itemMissing.length) {
        return `Item starting at row ${rowNumber} is missing required values: ${itemMissing.join(', ')}.`;
      }

      currentItem = createSaleInvoiceItemFromXlsxRow(row);
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

      appendTaxToItem(currentItem, createSaleInvoiceTaxFromXlsxRow(row));
    }

    const currentInvoiceError = validateSaleInvoiceXlsxInvoice(
      currentInvoice,
      currentInvoiceStartRow,
    );
    if (currentInvoiceError) return currentInvoiceError;
  }

  const finalItemError = validateSaleInvoiceXlsxItem(currentItem, currentItemStartRow);
  if (finalItemError) return finalItemError;

  const finalInvoiceError = validateSaleInvoiceXlsxInvoice(currentInvoice, currentInvoiceStartRow);
  if (finalInvoiceError) return finalInvoiceError;

  return invoices;
}

function createSaleInvoiceFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return {
    ...copyFields(row, INVOICE_FIELDS),
    items: [],
  };
}

function createSaleInvoiceItemFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
  return copyFields(row, ITEM_FIELDS);
}

function createSaleInvoiceTaxFromXlsxRow(row: BulkUploadPreviewRow): BulkUploadPreviewRow {
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

function validateSaleInvoiceXlsxInvoice(
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

function validateSaleInvoiceXlsxItem(
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
