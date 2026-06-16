import { describe, expect, it } from 'vitest';
import type {
  BulkUploadPreviewRow,
  BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import {
  SALE_INVOICE_BULK_UPLOAD_CONFIG,
  saleInvoiceXlsxRowsToPayloadRows,
} from './sale-invoice-bulk-upload.config';

const billingaddress = {
  name: 'Acme Retail',
  line1: 'Plot 10',
  street: 'MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560001',
  country: 'India',
};

const shippingaddress = {
  name: 'Acme Retail Warehouse',
  line1: 'Warehouse 4',
  street: 'Peenya Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  zip: '560058',
  country: 'India',
};

const invoiceHeader = {
  number: 'SI-001',
  date: '2026-04-01',
  duedate: '2026-04-15',
  customername: 'Acme Retail',
  currencycode: 'INR',
  billingaddress,
  shippingaddress,
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

describe('sale invoice bulk upload config', () => {
  it('maps one invoice with one item and two tax rows', () => {
    const result = saleInvoiceXlsxRowsToPayloadRows([
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

    const result = saleInvoiceXlsxRowsToPayloadRows([
      parsed(2, invoiceRow({ tax: 0, grandtotal: 10000, item: taxlessLaptopItem })),
      parsed(3, { item: mouseItem }),
      parsed(4, {
        ...invoiceHeader,
        number: 'SI-002',
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
        number: 'SI-002',
        itemtotal: 2000,
        subtotal: 2000,
        tax: 0,
        grandtotal: 2000,
        items: [serviceItem],
      },
    ]);
  });

  it('omits taxes for taxless items', () => {
    const taxlessItem = {
      name: 'Consulting',
      displayname: 'Consulting',
      order: 1,
      code: '9983',
      price: 5000,
      quantity: 1,
      itemtotal: 5000,
      subtotal: 5000,
      grandtotal: 5000,
    };

    const result = saleInvoiceXlsxRowsToPayloadRows([
      parsed(2, {
        ...invoiceHeader,
        itemtotal: 5000,
        subtotal: 5000,
        tax: 0,
        grandtotal: 5000,
        item: taxlessItem,
      }),
    ]);

    expect(result).toEqual([
      {
        ...invoiceHeader,
        itemtotal: 5000,
        subtotal: 5000,
        tax: 0,
        grandtotal: 5000,
        items: [taxlessItem],
      },
    ]);
  });

  it('returns row-specific errors for invalid row ordering and missing fields', () => {
    expect(saleInvoiceXlsxRowsToPayloadRows([parsed(2, { item: laptopItem })])).toBe(
      'Row 2 must start an invoice with Invoice Number before adding item or tax rows.',
    );

    expect(
      saleInvoiceXlsxRowsToPayloadRows([
        parsed(2, invoiceRow({ item: { ...laptopItem, displayname: undefined } })),
      ]),
    ).toBe('Item starting at row 2 is missing required values: Item Display Name.');

    expect(
      saleInvoiceXlsxRowsToPayloadRows([parsed(2, invoiceRow({ itemtax: { name: 'CGST 9%' } }))]),
    ).toBe(
      'Tax row 2 is missing required values: Tax Short Name, Tax Rate, Tax Applied To, Tax Amount.',
    );

    expect(saleInvoiceXlsxRowsToPayloadRows([parsed(2, { itemtax: cgstTax })])).toBe(
      'Row 2 has tax values before an invoice item. Start an invoice and item before adding tax rows.',
    );
  });

  it('keeps currency code and addresses optional for JSON and XLSX payloads', () => {
    const {
      billingaddress: _billingaddress,
      currencycode: _currencycode,
      shippingaddress: _shippingaddress,
      ...invoiceWithoutOptionalFields
    } = invoiceHeader;
    const result = saleInvoiceXlsxRowsToPayloadRows([
      parsed(
        2,
        invoiceRow({
          billingaddress: undefined,
          currencycode: undefined,
          shippingaddress: undefined,
          itemtax: cgstTax,
        }),
      ),
    ]);

    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('currencycode');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.name');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.line1');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.street');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.city');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.state');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.zip');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('billingaddress.country');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.name');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.line1');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.street');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.city');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.state');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.zip');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('shippingaddress.country');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain(
      'Billing Address Name',
    );
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain(
      'Billing Address Line 1',
    );
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Billing Street');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Billing City');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Billing State');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Billing Zip');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Billing Country');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain(
      'Shipping Address Name',
    );
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain(
      'Shipping Address Line 1',
    );
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Shipping Street');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Shipping City');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Shipping State');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Shipping Zip');
    expect(SALE_INVOICE_BULK_UPLOAD_CONFIG.xlsxRequiredHeaders).not.toContain('Shipping Country');
    expect(result).toEqual([
      {
        ...invoiceWithoutOptionalFields,
        items: [
          {
            ...laptopItem,
            taxes: [cgstTax],
          },
        ],
      },
    ]);
  });
});
