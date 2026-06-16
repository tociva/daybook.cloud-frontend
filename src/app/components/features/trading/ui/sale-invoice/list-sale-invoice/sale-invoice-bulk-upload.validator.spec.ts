import { describe, expect, it } from 'vitest';
import { validateSaleInvoiceBulkUploadPayload } from './sale-invoice-bulk-upload.validator';

function validItem(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Laptop',
    displayname: 'Laptop',
    code: '8471',
    order: 1,
    price: 10000,
    quantity: 1,
    itemtotal: 10000,
    subtotal: 10000,
    grandtotal: 10000,
    ...overrides,
  };
}

function validInvoice(overrides: Record<string, unknown> = {}) {
  return {
    number: 'SI-001',
    date: '2026-04-01',
    duedate: '2026-04-15',
    customername: 'Acme Retail',
    itemtotal: 10000,
    subtotal: 10000,
    grandtotal: 10000,
    items: [validItem()],
    ...overrides,
  };
}

function payload(invoices: readonly Record<string, unknown>[]) {
  return { invoices };
}

describe('validateSaleInvoiceBulkUploadPayload', () => {
  it('accepts a valid minimal invoice without addresses', () => {
    expect(validateSaleInvoiceBulkUploadPayload(payload([validInvoice()]))).toEqual([]);
  });

  it('rejects envelope violations', () => {
    expect(validateSaleInvoiceBulkUploadPayload({ invoices: [], extra: true })).toEqual([
      'Bulk upload JSON root must contain only "invoices".',
    ]);

    expect(validateSaleInvoiceBulkUploadPayload({ invoices: [] })).toEqual([
      '"invoices" must contain at least one record.',
    ]);
  });

  it('rejects partial address objects but allows omitted addresses', () => {
    const withoutAddresses = validateSaleInvoiceBulkUploadPayload(payload([validInvoice()]));
    expect(withoutAddresses).toEqual([]);

    const withPartialAddress = validateSaleInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          billingaddress: { name: 'Acme Retail', line1: 'Plot 10' },
        }),
      ]),
    );

    expect(withPartialAddress.some((message) => message.includes('billingaddress.street'))).toBe(true);
  });

  it('rejects unknown invoice, item, and tax fields', () => {
    const invoiceErrors = validateSaleInvoiceBulkUploadPayload(
      payload([validInvoice({ unexpected: 'x' })]),
    );
    expect(invoiceErrors).toContain('Invoice 1 (SI-001): unknown field "unexpected".');

    const itemErrors = validateSaleInvoiceBulkUploadPayload(
      payload([validInvoice({ items: [validItem({ extra: true })] })]),
    );
    expect(itemErrors.some((message) => message.includes('unknown field "extra"'))).toBe(true);

    const taxErrors = validateSaleInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          items: [
            validItem({
              taxamount: 1800,
              grandtotal: 11800,
              taxes: [{ name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 100, amount: 900, foo: 1 }],
            }),
          ],
        }),
      ]),
    );
    expect(taxErrors.some((message) => message.includes('unknown field "foo"'))).toBe(true);
  });

  it('detects math mismatches', () => {
    const errors = validateSaleInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          itemtotal: 9999,
          items: [validItem()],
        }),
      ]),
    );

    expect(errors).toContain(
      'Invoice 1 (SI-001): itemtotal must equal the sum of item itemtotal values.',
    );
  });

  it('detects duplicate invoice numbers and duplicate items within an invoice', () => {
    const duplicateNumberErrors = validateSaleInvoiceBulkUploadPayload(
      payload([validInvoice(), validInvoice({ number: 'si-001' })]),
    );
    expect(duplicateNumberErrors.some((message) => message.includes('duplicate invoice number'))).toBe(
      true,
    );

    const duplicateItemErrors = validateSaleInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          items: [validItem(), validItem({ order: 2 })],
        }),
      ]),
    );
    expect(
      duplicateItemErrors.some((message) => message.includes('duplicate item name and display name')),
    ).toBe(true);
  });

  it('validates decimal precision using branch minor unit', () => {
    const errors = validateSaleInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          itemtotal: 10000.123,
          items: [validItem({ itemtotal: 10000.123 })],
        }),
      ]),
      { minorUnit: 2 },
    );

    expect(errors.some((message) => message.includes('must not exceed 2 decimal places'))).toBe(true);
  });
});
