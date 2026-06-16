import { describe, expect, it } from 'vitest';
import { validateVendorPaymentBulkUploadPayload } from './vendor-payment-bulk-upload.validator';

function validAllocation(overrides: Record<string, unknown> = {}) {
  return {
    purchaseinvoicenumber: 'PI-001',
    amount: 11800,
    ...overrides,
  };
}

function validPayment(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-04-20',
    amount: 11800,
    vendorname: 'Acme Supplies',
    bcashname: 'HDFC Current Account',
    invoices: [validAllocation()],
    ...overrides,
  };
}

function payload(payments: readonly Record<string, unknown>[]) {
  return { payments };
}

describe('validateVendorPaymentBulkUploadPayload', () => {
  it('accepts a valid allocated payment without currencycode', () => {
    expect(validateVendorPaymentBulkUploadPayload(payload([validPayment()]))).toEqual([]);
  });

  it('accepts a valid unallocated payment', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ invoices: [] })])),
    ).toEqual([]);
  });

  it('rejects envelope and payments array violations', () => {
    expect(validateVendorPaymentBulkUploadPayload({ payments: [], extra: true })).toEqual([
      'Bulk upload JSON root must contain only "payments".',
    ]);

    expect(validateVendorPaymentBulkUploadPayload({ payments: [] })).toEqual([
      '"payments" must contain at least one record.',
    ]);

    expect(validateVendorPaymentBulkUploadPayload({ payments: {} })).toEqual([
      '"payments" must be an array.',
    ]);
  });

  it('requires invoices to be present but allows it to be empty', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ invoices: [] })])),
    ).toEqual([]);

    const { invoices: _invoices, ...withoutInvoices } = validPayment();

    expect(validateVendorPaymentBulkUploadPayload(payload([withoutInvoices]))).toContain(
      'Payment 1 (Acme Supplies): invoices is required and must be an array.',
    );

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ invoices: 'PI-001' })])),
    ).toContain('Payment 1 (Acme Supplies): invoices must be an array.');
  });

  it('rejects unknown fields at root, payment, and allocation levels', () => {
    expect(validateVendorPaymentBulkUploadPayload({ payments: [], unexpected: true })).toEqual([
      'Bulk upload JSON root must contain only "payments".',
    ]);

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ unexpected: 'x' })])),
    ).toContain('Payment 1 (Acme Supplies): unknown field "unexpected".');

    expect(
      validateVendorPaymentBulkUploadPayload(
        payload([validPayment({ invoices: [validAllocation({ extra: true })] })]),
      ),
    ).toContain('Payment 1 (Acme Supplies), allocation 1: unknown field "extra".');
  });

  it('rejects invalid and impossible payment dates', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ date: '20-04-2026' })])),
    ).toContain('Payment 1 (Acme Supplies): date must be formatted as YYYY-MM-DD.');

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ date: '2026-02-30' })])),
    ).toContain('Payment 1 (Acme Supplies): date must be formatted as YYYY-MM-DD.');
  });

  it('rejects invalid payment and allocation amounts', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ amount: '11800' })])),
    ).toContain('Payment 1 (Acme Supplies): amount is required and must be a number.');

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ amount: -1 })])),
    ).toContain('Payment 1 (Acme Supplies): amount must be greater than or equal to 0.');

    expect(
      validateVendorPaymentBulkUploadPayload(
        payload([validPayment({ invoices: [validAllocation({ amount: '11800' })] })]),
      ),
    ).toContain(
      'Payment 1 (Acme Supplies), allocation 1: amount is required and must be a number.',
    );

    expect(
      validateVendorPaymentBulkUploadPayload(
        payload([validPayment({ invoices: [validAllocation({ amount: -1 })] })]),
      ),
    ).toContain(
      'Payment 1 (Acme Supplies), allocation 1: amount must be greater than or equal to 0.',
    );
  });

  it('rejects missing or invalid allocation fields', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(
        payload([validPayment({ invoices: [validAllocation({ purchaseinvoicenumber: '' })] })]),
      ),
    ).toContain(
      'Payment 1 (Acme Supplies), allocation 1: purchaseinvoicenumber is required and must be a non-empty string.',
    );

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ invoices: [42] })])),
    ).toContain('Payment 1 (Acme Supplies), allocation 1: must be an object.');
  });

  it('rejects invalid optional fields', () => {
    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ currencycode: '' })])),
    ).toContain('Payment 1 (Acme Supplies): currencycode must be a non-empty string.');

    expect(
      validateVendorPaymentBulkUploadPayload(payload([validPayment({ description: 100 })])),
    ).toContain('Payment 1 (Acme Supplies): description must be a string.');
  });
});
