import { describe, expect, it } from 'vitest';
import type {
  BulkUploadPreviewRow,
  BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import {
  PURCHASE_INVOICE_BULK_UPLOAD_CONFIG,
  purchaseInvoiceXlsxRowsToPayloadRows,
} from './purchase-invoice-bulk-upload.config';

const vendoraddress = {
  name: 'Acme Supplies',
  line1: 'Plot 42',
  street: 'Industrial Layout',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560100',
  country: 'India',
};

const invoiceHeader = {
  number: 'PI-001',
  date: '2026-04-01',
  duedate: '2026-04-15',
  vendorname: 'Acme Supplies',
  currencycode: 'INR',
  vendoraddress,
  itemtotal: 10000,
  subtotal: 10000,
  tax: 1800,
  roundoff: 0,
  grandtotal: 11800,
};

const laptopItem = {
  name: 'Laptop',
  displayname: 'Laptop',
  order: 1,
  code: '8471',
  price: 10000,
  quantity: 1,
  itemtotal: 10000,
  subtotal: 10000,
  taxamount: 1800,
  grandtotal: 11800,
};

const cgstTax = { name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 100, amount: 900 };
const sgstTax = { name: 'SGST 9%', shortname: 'SGST', rate: 9, appliedto: 100, amount: 900 };

function parsed(rowNumber: number, row: BulkUploadPreviewRow): BulkUploadXlsxParsedRow {
  return { row, rowNumber };
}

function invoiceRow(overrides: BulkUploadPreviewRow = {}): BulkUploadPreviewRow {
  return {
    ...invoiceHeader,
    item: laptopItem,
    ...overrides,
  };
}

describe('purchase invoice bulk upload config', () => {
  it('maps one invoice with one item and two tax rows', () => {
    const result = purchaseInvoiceXlsxRowsToPayloadRows([
      parsed(2, invoiceRow({ itemtax: cgstTax })),
      parsed(3, { itemtax: sgstTax }),
    ]);

    expect(result).toEqual([
      {
        ...invoiceHeader,
        items: [
          {
            ...laptopItem,
            taxes: [cgstTax, sgstTax],
          },
        ],
      },
    ]);
  });

  it('groups multiple invoices and multiple items', () => {
    const taxlessLaptopItem = {
      name: 'Laptop',
      displayname: 'Laptop',
      order: 1,
      code: '8471',
      price: 10000,
      quantity: 1,
      itemtotal: 10000,
      subtotal: 10000,
      grandtotal: 10000,
    };
    const mouseItem = {
      name: 'Mouse',
      displayname: 'Mouse',
      order: 2,
      code: '8471',
      price: 500,
      quantity: 2,
      itemtotal: 1000,
      subtotal: 1000,
      grandtotal: 1000,
    };
    const serviceItem = {
      name: 'Installation',
      displayname: 'Installation',
      order: 1,
      code: '9987',
      price: 2000,
      quantity: 1,
      itemtotal: 2000,
      subtotal: 2000,
      grandtotal: 2000,
    };

    const result = purchaseInvoiceXlsxRowsToPayloadRows([
      parsed(2, invoiceRow({ tax: 0, grandtotal: 10000, item: taxlessLaptopItem })),
      parsed(3, { item: mouseItem }),
      parsed(4, {
        ...invoiceHeader,
        number: 'PI-002',
        itemtotal: 2000,
        subtotal: 2000,
        tax: 0,
        grandtotal: 2000,
        item: serviceItem,
      }),
    ]);

    expect(result).toEqual([
      {
        ...invoiceHeader,
        tax: 0,
        grandtotal: 10000,
        items: [taxlessLaptopItem, mouseItem],
      },
      {
        ...invoiceHeader,
        number: 'PI-002',
        itemtotal: 2000,
        subtotal: 2000,
        tax: 0,
        grandtotal: 2000,
        items: [serviceItem],
      },
    ]);
  });

  it('keeps currency code and vendor address optional for JSON and XLSX payloads', () => {
    const {
      currencycode: _currencycode,
      vendoraddress: _vendoraddress,
      ...invoiceWithoutOptionalFields
    } = invoiceHeader;
    const result = purchaseInvoiceXlsxRowsToPayloadRows([
      parsed(2, invoiceRow({ currencycode: undefined, vendoraddress: undefined })),
    ]);

    expect(PURCHASE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('currencycode');
    expect(PURCHASE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('vendoraddress');
    expect(result).toEqual([
      {
        ...invoiceWithoutOptionalFields,
        items: [laptopItem],
      },
    ]);
  });

  it('returns row-specific errors for invalid row ordering and missing fields', () => {
    expect(purchaseInvoiceXlsxRowsToPayloadRows([parsed(2, { item: laptopItem })])).toBe(
      'Row 2 must start an invoice with Invoice Number before adding item or tax rows.',
    );

    expect(
      purchaseInvoiceXlsxRowsToPayloadRows([
        parsed(2, invoiceRow({ item: { ...laptopItem, displayname: undefined } })),
      ]),
    ).toBe('Item starting at row 2 is missing required values: Item Display Name.');

    expect(
      purchaseInvoiceXlsxRowsToPayloadRows([
        parsed(2, invoiceRow({ vendoraddress: { name: 'Acme Supplies' } })),
      ]),
    ).toBe(
      'Vendor address on invoice starting at row 2 is missing required values: Vendor Address Line 1, Vendor Street, Vendor City, Vendor State, Vendor Zip, Vendor Country.',
    );

    expect(
      purchaseInvoiceXlsxRowsToPayloadRows([
        parsed(2, invoiceRow({ itemtax: { name: 'CGST 9%' } })),
      ]),
    ).toBe(
      'Tax row 2 is missing required values: Tax Short Name, Tax Rate, Tax Applied To, Tax Amount.',
    );

    expect(purchaseInvoiceXlsxRowsToPayloadRows([parsed(2, { itemtax: cgstTax })])).toBe(
      'Row 2 has tax values before an invoice item. Start an invoice and item before adding tax rows.',
    );
  });
});
