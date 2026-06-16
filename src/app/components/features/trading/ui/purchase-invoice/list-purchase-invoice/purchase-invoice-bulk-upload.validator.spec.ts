import { describe, expect, it } from 'vitest';
import { validatePurchaseInvoiceBulkUploadPayload } from './purchase-invoice-bulk-upload.validator';

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
    number: 'PI-001',
    date: '2026-04-01',
    duedate: '2026-04-15',
    vendorname: 'Acme Supplies',
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

describe('validatePurchaseInvoiceBulkUploadPayload', () => {
  it('accepts a valid minimal invoice without currency code or vendor address', () => {
    expect(validatePurchaseInvoiceBulkUploadPayload(payload([validInvoice()]))).toEqual([]);
  });

  it('rejects envelope violations', () => {
    expect(validatePurchaseInvoiceBulkUploadPayload({ invoices: [], extra: true })).toEqual([
      'Bulk upload JSON root must contain only "invoices".',
    ]);

    expect(validatePurchaseInvoiceBulkUploadPayload({ invoices: [] })).toEqual([
      '"invoices" must contain at least one record.',
    ]);
  });

  it('accepts omitted and partial vendor address objects', () => {
    expect(validatePurchaseInvoiceBulkUploadPayload(payload([validInvoice()]))).toEqual([]);
    expect(
      validatePurchaseInvoiceBulkUploadPayload(
        payload([
          validInvoice({
            vendoraddress: { name: 'Acme Supplies', line1: 'Plot 42' },
          }),
        ]),
      ),
    ).toEqual([]);
  });

  it('rejects invalid vendor address shape and supplied field types', () => {
    const nonObjectErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([validInvoice({ vendoraddress: 'Acme Supplies' })]),
    );
    expect(nonObjectErrors).toContain('Invoice 1 (PI-001): vendoraddress must be an object.');

    const unknownFieldErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([validInvoice({ vendoraddress: { name: 'Acme Supplies', extra: 'x' } })]),
    );
    expect(unknownFieldErrors).toContain(
      'Invoice 1 (PI-001): vendoraddress.unknown field "extra".',
    );

    const typeErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([validInvoice({ vendoraddress: { city: 123 } })]),
    );
    expect(typeErrors).toContain('Invoice 1 (PI-001): vendoraddress.city must be a string.');
  });

  it('rejects unknown fields including stale id keys', () => {
    const invoiceErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([validInvoice({ vendorid: 'v1' })]),
    );
    expect(invoiceErrors).toContain('Invoice 1 (PI-001): unknown field "vendorid".');

    const itemErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([validInvoice({ items: [validItem({ itemid: 'i1' })] })]),
    );
    expect(itemErrors.some((message) => message.includes('unknown field "itemid"'))).toBe(true);

    const taxErrors = validatePurchaseInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          tax: 1800,
          grandtotal: 11800,
          items: [
            validItem({
              taxamount: 1800,
              grandtotal: 11800,
              taxes: [
                {
                  name: 'CGST 9%',
                  shortname: 'CGST',
                  rate: 9,
                  appliedto: 100,
                  amount: 900,
                  taxid: 't1',
                },
              ],
            }),
          ],
        }),
      ]),
    );
    expect(taxErrors.some((message) => message.includes('unknown field "taxid"'))).toBe(true);
  });

  it('detects duplicate invoice numbers only for the same vendor within the file', () => {
    const errors = validatePurchaseInvoiceBulkUploadPayload(
      payload([
        validInvoice(),
        validInvoice({ number: 'pi-001', vendorname: 'Acme Supplies' }),
        validInvoice({ number: 'PI-001', vendorname: 'Other Vendor' }),
      ]),
    );

    expect(errors.some((message) => message.includes('duplicate invoice number'))).toBe(true);
    expect(errors.some((message) => message.includes('Other Vendor'))).toBe(false);
  });

  it('requires item taxamount when taxes are present', () => {
    const errors = validatePurchaseInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          items: [
            validItem({
              taxes: [{ name: 'CGST 9%', shortname: 'CGST', rate: 9, appliedto: 100, amount: 900 }],
            }),
          ],
        }),
      ]),
    );

    expect(errors).toContain(
      'Invoice 1 (PI-001), Laptop: taxamount is required when taxes are present.',
    );
  });

  it('detects math mismatches', () => {
    const errors = validatePurchaseInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          itemtotal: 9999,
          items: [validItem()],
        }),
      ]),
    );

    expect(errors).toContain(
      'Invoice 1 (PI-001): itemtotal must equal the sum of item itemtotal values.',
    );
  });

  it('validates amount precision using branch minor unit', () => {
    const errors = validatePurchaseInvoiceBulkUploadPayload(
      payload([
        validInvoice({
          itemtotal: 10000.123,
          subtotal: 10000.123,
          grandtotal: 10000.123,
          items: [
            validItem({
              price: 10000.123,
              itemtotal: 10000.123,
              subtotal: 10000.123,
              grandtotal: 10000.123,
            }),
          ],
        }),
      ]),
      { minorUnit: 2 },
    );

    expect(errors.some((message) => message.includes('must not exceed 2 decimal places'))).toBe(
      true,
    );
  });
});
