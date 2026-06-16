import { describe, expect, it } from 'vitest';
import type {
  BulkUploadPreviewRow,
  BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import {
  VENDOR_PAYMENT_BULK_UPLOAD_CONFIG,
  vendorPaymentXlsxRowsToPayloadRows,
} from './vendor-payment-bulk-upload.config';

const paymentHeader = {
  date: '2026-04-20',
  amount: 11800,
  vendorname: 'Acme Supplies',
  bcashname: 'HDFC Current Account',
  currencycode: 'INR',
  description: 'Payment against PI-001',
};

const pi001Allocation = { purchaseinvoicenumber: 'PI-001', amount: 8000 };
const pi002Allocation = { purchaseinvoicenumber: 'PI-002', amount: 3800 };

function parsed(rowNumber: number, row: BulkUploadPreviewRow): BulkUploadXlsxParsedRow {
  return { row, rowNumber };
}

function paymentRow(overrides: BulkUploadPreviewRow = {}): BulkUploadPreviewRow {
  return {
    ...paymentHeader,
    allocation: pi001Allocation,
    ...overrides,
  };
}

describe('vendor payment bulk upload config', () => {
  it('maps a single allocated payment row', () => {
    const result = vendorPaymentXlsxRowsToPayloadRows([parsed(2, paymentRow())]);

    expect(result).toEqual([
      {
        ...paymentHeader,
        invoices: [pi001Allocation],
      },
    ]);
  });

  it('maps an unallocated payment row', () => {
    const result = vendorPaymentXlsxRowsToPayloadRows([
      parsed(2, paymentRow({ allocation: undefined })),
    ]);

    expect(result).toEqual([
      {
        ...paymentHeader,
        invoices: [],
      },
    ]);
  });

  it('maps continuation allocation rows to the previous payment', () => {
    const result = vendorPaymentXlsxRowsToPayloadRows([
      parsed(2, paymentRow()),
      parsed(3, { allocation: pi002Allocation }),
    ]);

    expect(result).toEqual([
      {
        ...paymentHeader,
        invoices: [pi001Allocation, pi002Allocation],
      },
    ]);
  });

  it('keeps currencycode optional and does not require invoices through generic paths', () => {
    const { currencycode: _currencycode, ...paymentWithoutCurrency } = paymentHeader;
    const result = vendorPaymentXlsxRowsToPayloadRows([
      parsed(2, paymentRow({ currencycode: undefined, allocation: undefined })),
    ]);

    expect(VENDOR_PAYMENT_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('currencycode');
    expect(VENDOR_PAYMENT_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('invoices');
    expect(result).toEqual([
      {
        ...paymentWithoutCurrency,
        invoices: [],
      },
    ]);
  });

  it('returns row-specific errors for invalid row ordering and missing fields', () => {
    expect(vendorPaymentXlsxRowsToPayloadRows([parsed(2, { allocation: pi001Allocation })])).toBe(
      'Row 2 has allocation values before a payment. Start a payment before adding allocation rows.',
    );

    expect(
      vendorPaymentXlsxRowsToPayloadRows([parsed(2, paymentRow({ vendorname: undefined }))]),
    ).toBe('Payment starting at row 2 is missing required values: Vendor Name.');

    expect(
      vendorPaymentXlsxRowsToPayloadRows([
        parsed(2, paymentRow({ allocation: { purchaseinvoicenumber: 'PI-001' } })),
      ]),
    ).toBe('Allocation row 2 is missing required values: Allocation Amount.');
  });
});
