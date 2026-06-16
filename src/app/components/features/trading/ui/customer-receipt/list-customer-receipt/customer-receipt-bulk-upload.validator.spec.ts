import { describe, expect, it } from 'vitest';
import { validateCustomerReceiptBulkUploadPayload } from './customer-receipt-bulk-upload.validator';

function validAllocation(overrides: Record<string, unknown> = {}) {
  return {
    saleinvoicenumber: 'SI-001',
    amount: 11800,
    ...overrides,
  };
}

function validReceipt(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-04-20',
    amount: 11800,
    customername: 'Acme Retail',
    bcashname: 'HDFC Current Account',
    invoices: [validAllocation()],
    ...overrides,
  };
}

function payload(receipts: readonly Record<string, unknown>[]) {
  return { receipts };
}

describe('validateCustomerReceiptBulkUploadPayload', () => {
  it('accepts a valid allocated receipt without number or currencycode', () => {
    expect(validateCustomerReceiptBulkUploadPayload(payload([validReceipt()]))).toEqual([]);
  });

  it('accepts a valid unallocated receipt', () => {
    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ invoices: [] })])),
    ).toEqual([]);
  });

  it('rejects envelope and receipts array violations', () => {
    expect(validateCustomerReceiptBulkUploadPayload({ receipts: [], extra: true })).toEqual([
      'Bulk upload JSON root must contain only "receipts".',
    ]);

    expect(validateCustomerReceiptBulkUploadPayload({ receipts: [] })).toEqual([
      '"receipts" must contain at least one record.',
    ]);

    expect(validateCustomerReceiptBulkUploadPayload({ receipts: {} })).toEqual([
      '"receipts" must be an array.',
    ]);
  });

  it('requires invoices to be present but allows it to be empty', () => {
    expect(validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ invoices: [] })]))).toEqual(
      [],
    );

    const { invoices: _invoices, ...withoutInvoices } = validReceipt();

    expect(validateCustomerReceiptBulkUploadPayload(payload([withoutInvoices]))).toContain(
      'Receipt 1 (-): invoices is required and must be an array.',
    );

    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ invoices: 'SI-001' })])),
    ).toContain('Receipt 1 (-): invoices must be an array.');
  });

  it('rejects unknown fields at root, receipt, and allocation levels', () => {
    expect(validateCustomerReceiptBulkUploadPayload({ receipts: [], unexpected: true })).toEqual([
      'Bulk upload JSON root must contain only "receipts".',
    ]);

    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ unexpected: 'x' })])),
    ).toContain('Receipt 1 (-): unknown field "unexpected".');

    expect(
      validateCustomerReceiptBulkUploadPayload(
        payload([validReceipt({ invoices: [validAllocation({ extra: true })] })]),
      ),
    ).toContain('Receipt 1 (-), allocation 1: unknown field "extra".');
  });

  it('rejects invalid and impossible receipt dates', () => {
    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ date: '20-04-2026' })])),
    ).toContain('Receipt 1 (-): date must be formatted as YYYY-MM-DD.');

    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ date: '2026-02-30' })])),
    ).toContain('Receipt 1 (-): date must be formatted as YYYY-MM-DD.');
  });

  it('rejects invalid receipt and allocation amounts', () => {
    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ amount: '11800' })])),
    ).toContain('Receipt 1 (-): amount is required and must be a number.');

    expect(
      validateCustomerReceiptBulkUploadPayload(
        payload([validReceipt({ invoices: [validAllocation({ amount: '11800' })] })]),
      ),
    ).toContain('Receipt 1 (-), allocation 1: amount is required and must be a number.');
  });

  it('rejects missing or invalid allocation fields', () => {
    expect(
      validateCustomerReceiptBulkUploadPayload(
        payload([validReceipt({ invoices: [validAllocation({ saleinvoicenumber: '' })] })]),
      ),
    ).toContain(
      'Receipt 1 (-), allocation 1: saleinvoicenumber is required and must be a non-empty string.',
    );

    expect(
      validateCustomerReceiptBulkUploadPayload(payload([validReceipt({ invoices: [42] })])),
    ).toContain('Receipt 1 (-), allocation 1: must be an object.');
  });
});
