import { describe, expect, it } from 'vitest';
import type { CustomerReceipt } from '../../../data/customer-receipt';
import type { SaleInvoice } from '../../../data/sale-invoice';
import {
  buildSaleInvoiceReceiptPayload,
  calculateSaleInvoiceOutstanding,
  calculateSaleInvoiceReceivedTotal,
  getSaleInvoiceReceiptDraftError,
  normalizeSaleInvoiceReceiptRows,
  type SaleInvoiceReceiptDraft,
} from './sale-invoice-receipts.util';

function invoice(overrides: Partial<SaleInvoice> = {}): SaleInvoice {
  return {
    id: 'si-1',
    currencycode: 'INR',
    customerid: 'customer-1',
    date: '2026-06-18',
    grandtotal: 1000,
    receipts: [],
    ...overrides,
  };
}

function draft(overrides: Partial<SaleInvoiceReceiptDraft> = {}): SaleInvoiceReceiptDraft {
  return {
    amount: '250',
    autoNumbering: true,
    bankCashId: 'bank-1',
    date: '2026-06-18',
    description: '',
    number: 'Auto Number',
    ...overrides,
  };
}

describe('sale invoice receipts helpers', () => {
  it('maps invoice receipt links with nested customer receipt data', () => {
    const rows = normalizeSaleInvoiceReceiptRows(
      invoice({
        receipts: [
          {
            id: 'allocation-1',
            amount: 250,
            customerreceiptid: 'receipt-1',
            customerreceipt: {
              id: 'receipt-1',
              number: 'RCT-001',
              date: '2026-06-18',
              amount: 250,
              currencycode: 'INR',
              description: 'First receipt',
              bcashid: 'bank-1',
              bcash: { id: 'bank-1', name: 'Main Bank' },
            },
          },
        ],
      }),
    );

    expect(rows).toEqual([
      {
        allocationId: 'allocation-1',
        amount: 250,
        bankCash: { id: 'bank-1', name: 'Main Bank' },
        bankCashId: 'bank-1',
        currencycode: 'INR',
        date: '2026-06-18',
        description: 'First receipt',
        hasReceiptDetail: true,
        number: 'RCT-001',
        receiptId: 'receipt-1',
      },
    ]);
  });

  it('falls back to customer receipt records when link data only has the receipt id', () => {
    const fallbackReceipts: readonly CustomerReceipt[] = [
      {
        id: 'receipt-2',
        number: 'RCT-002',
        date: '2026-06-19',
        amount: 300,
        currencycode: 'INR',
        customerid: 'customer-1',
        bcashid: 'cash-1',
        bcash: { id: 'cash-1', name: 'Petty Cash' },
      },
    ];

    const rows = normalizeSaleInvoiceReceiptRows(
      invoice({ receipts: [{ id: 'allocation-2', amount: 300, customerreceiptid: 'receipt-2' }] }),
      fallbackReceipts,
    );

    expect(rows[0]).toMatchObject({
      amount: 300,
      bankCash: { id: 'cash-1', name: 'Petty Cash' },
      bankCashId: 'cash-1',
      date: '2026-06-19',
      hasReceiptDetail: true,
      number: 'RCT-002',
      receiptId: 'receipt-2',
    });
  });

  it('calculates received and outstanding totals', () => {
    const source = invoice({
      grandtotal: 1000,
      receipts: [
        { amount: 250, customerreceiptid: 'receipt-1' },
        { amount: 100.456, customerreceiptid: 'receipt-2' },
      ],
    });

    expect(calculateSaleInvoiceReceivedTotal(source)).toBe(350.46);
    expect(calculateSaleInvoiceOutstanding(source)).toBe(649.54);
  });

  it('builds an auto-numbered customer receipt payload', () => {
    expect(buildSaleInvoiceReceiptPayload(invoice(), draft())).toEqual({
      amount: 250,
      bcashid: 'bank-1',
      cprops: { autoNumbering: true },
      currencycode: 'INR',
      customerid: 'customer-1',
      date: '2026-06-18',
      invoices: [{ amount: 250, saleinvoiceid: 'si-1' }],
    });
  });

  it('builds a manual-numbered customer receipt payload', () => {
    expect(
      buildSaleInvoiceReceiptPayload(
        invoice({ currencycode: undefined, currency: { code: 'USD' } }),
        draft({
          autoNumbering: false,
          description: 'Bank transfer',
          number: 'RCT-MANUAL',
        }),
      ),
    ).toEqual({
      amount: 250,
      bcashid: 'bank-1',
      cprops: { autoNumbering: false },
      currencycode: 'USD',
      customerid: 'customer-1',
      date: '2026-06-18',
      description: 'Bank transfer',
      invoices: [{ amount: 250, saleinvoiceid: 'si-1' }],
      number: 'RCT-MANUAL',
    });
  });

  it('rejects invalid inline receipt drafts', () => {
    expect(getSaleInvoiceReceiptDraftError(invoice(), draft({ bankCashId: '' }))).toBe(
      'Bank/Cash account is required.',
    );
    expect(getSaleInvoiceReceiptDraftError(invoice(), draft({ amount: '0' }))).toBe(
      'Amount must be greater than 0.',
    );
    expect(getSaleInvoiceReceiptDraftError(invoice(), draft({ amount: '1000.01' }))).toBe(
      'Amount cannot exceed outstanding balance.',
    );
    expect(
      getSaleInvoiceReceiptDraftError(invoice(), draft({ autoNumbering: false, number: '' })),
    ).toBe('Receipt number is required.');
    expect(
      getSaleInvoiceReceiptDraftError(invoice(), draft(), {
        dateError: 'Receipt date must be inside the fiscal year.',
      }),
    ).toBe('Receipt date must be inside the fiscal year.');
  });
});
