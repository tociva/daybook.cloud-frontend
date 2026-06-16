import { describe, expect, it } from 'vitest';
import type {
  BulkUploadPreviewRow,
  BulkUploadXlsxParsedRow,
} from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import {
  CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG,
  customerReceiptXlsxRowsToPayloadRows,
} from './customer-receipt-bulk-upload.config';

const receiptHeader = {
  number: 'CR-001',
  date: '2026-04-20',
  amount: 11800,
  customername: 'Acme Retail',
  bcashname: 'HDFC Current Account',
  currencycode: 'INR',
  description: 'Receipt against SI-001',
};

const si001Allocation = { saleinvoicenumber: 'SI-001', amount: 8000 };
const si002Allocation = { saleinvoicenumber: 'SI-002', amount: 3800 };

function parsed(rowNumber: number, row: BulkUploadPreviewRow): BulkUploadXlsxParsedRow {
  return { row, rowNumber };
}

function receiptRow(overrides: BulkUploadPreviewRow = {}): BulkUploadPreviewRow {
  return {
    ...receiptHeader,
    allocation: si001Allocation,
    ...overrides,
  };
}

describe('customer receipt bulk upload config', () => {
  it('maps a single allocated receipt row', () => {
    const result = customerReceiptXlsxRowsToPayloadRows([parsed(2, receiptRow())]);

    expect(result).toEqual([
      {
        ...receiptHeader,
        invoices: [si001Allocation],
      },
    ]);
  });

  it('maps an unallocated receipt row', () => {
    const result = customerReceiptXlsxRowsToPayloadRows([
      parsed(2, receiptRow({ allocation: undefined })),
    ]);

    expect(result).toEqual([
      {
        ...receiptHeader,
        invoices: [],
      },
    ]);
  });

  it('maps continuation allocation rows to the previous receipt', () => {
    const result = customerReceiptXlsxRowsToPayloadRows([
      parsed(2, receiptRow()),
      parsed(3, { allocation: si002Allocation }),
    ]);

    expect(result).toEqual([
      {
        ...receiptHeader,
        invoices: [si001Allocation, si002Allocation],
      },
    ]);
  });

  it('keeps currencycode optional and does not require invoices through generic paths', () => {
    const { currencycode: _currencycode, ...receiptWithoutCurrency } = receiptHeader;
    const result = customerReceiptXlsxRowsToPayloadRows([
      parsed(2, receiptRow({ currencycode: undefined, allocation: undefined })),
    ]);

    expect(CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('currencycode');
    expect(CUSTOMER_RECEIPT_BULK_UPLOAD_CONFIG.requiredPaths).not.toContain('invoices');
    expect(result).toEqual([
      {
        ...receiptWithoutCurrency,
        invoices: [],
      },
    ]);
  });

  it('returns row-specific errors for invalid row ordering and missing fields', () => {
    expect(customerReceiptXlsxRowsToPayloadRows([parsed(2, { allocation: si001Allocation })])).toBe(
      'Row 2 has allocation values before a receipt. Start a receipt before adding allocation rows.',
    );

    expect(
      customerReceiptXlsxRowsToPayloadRows([
        parsed(2, receiptRow({ customername: undefined })),
      ]),
    ).toBe('Receipt starting at row 2 is missing required values: Customer Name.');

    expect(
      customerReceiptXlsxRowsToPayloadRows([
        parsed(2, receiptRow({ allocation: { saleinvoicenumber: 'SI-001' } })),
      ]),
    ).toBe('Allocation row 2 is missing required values: Allocation Amount.');
  });
});
