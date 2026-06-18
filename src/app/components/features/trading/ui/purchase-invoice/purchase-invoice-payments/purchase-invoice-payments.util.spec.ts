import { describe, expect, it } from 'vitest';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import type { VendorPayment } from '../../../data/vendor-payment';
import {
  buildPurchaseInvoicePaymentPayload,
  calculatePurchaseInvoiceOutstanding,
  calculatePurchaseInvoicePaidTotal,
  getPurchaseInvoicePaymentDraftError,
  normalizePurchaseInvoicePaymentRows,
  type PurchaseInvoicePaymentDraft,
} from './purchase-invoice-payments.util';

function invoice(overrides: Partial<PurchaseInvoice> = {}): PurchaseInvoice {
  return {
    id: 'pi-1',
    currencycode: 'INR',
    date: '2026-06-18',
    grandtotal: 1000,
    vendorid: 'vendor-1',
    payments: [],
    ...overrides,
  };
}

function draft(overrides: Partial<PurchaseInvoicePaymentDraft> = {}): PurchaseInvoicePaymentDraft {
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

describe('purchase invoice payments helpers', () => {
  it('maps invoice payment links with nested vendor payment data', () => {
    const rows = normalizePurchaseInvoicePaymentRows(
      invoice({
        payments: [
          {
            id: 'allocation-1',
            amount: 250,
            vendorpaymentid: 'payment-1',
            vendorpayment: {
              id: 'payment-1',
              number: 'PAY-001',
              date: '2026-06-18',
              amount: 250,
              currencycode: 'INR',
              description: 'First payment',
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
        description: 'First payment',
        hasPaymentDetail: true,
        number: 'PAY-001',
        paymentId: 'payment-1',
      },
    ]);
  });

  it('falls back to vendor payment records when link data only has the payment id', () => {
    const fallbackPayments: readonly VendorPayment[] = [
      {
        id: 'payment-2',
        number: 'PAY-002',
        date: '2026-06-19',
        amount: 300,
        currencycode: 'INR',
        vendorid: 'vendor-1',
        bcashid: 'cash-1',
        bcash: { id: 'cash-1', name: 'Petty Cash' },
      },
    ];

    const rows = normalizePurchaseInvoicePaymentRows(
      invoice({ payments: [{ id: 'allocation-2', amount: 300, vendorpaymentid: 'payment-2' }] }),
      fallbackPayments,
    );

    expect(rows[0]).toMatchObject({
      amount: 300,
      bankCash: { id: 'cash-1', name: 'Petty Cash' },
      bankCashId: 'cash-1',
      date: '2026-06-19',
      hasPaymentDetail: true,
      number: 'PAY-002',
      paymentId: 'payment-2',
    });
  });

  it('calculates paid and outstanding totals', () => {
    const source = invoice({
      grandtotal: 1000,
      payments: [
        { amount: 250, vendorpaymentid: 'payment-1' },
        { amount: 100.456, vendorpaymentid: 'payment-2' },
      ],
    });

    expect(calculatePurchaseInvoicePaidTotal(source)).toBe(350.46);
    expect(calculatePurchaseInvoiceOutstanding(source)).toBe(649.54);
  });

  it('treats the reported floating-point INR total as fully paid', () => {
    const source = invoice({
      currency: { code: 'INR', minorunit: 2 },
      grandtotal: 1585.68,
      payments: [
        { amount: 1343.8, vendorpaymentid: 'payment-1' },
        { amount: 241.88, vendorpaymentid: 'payment-2' },
      ],
    });

    expect(calculatePurchaseInvoicePaidTotal(source)).toBe(1585.68);
    expect(calculatePurchaseInvoiceOutstanding(source)).toBe(0);
  });

  it('uses the purchase invoice currency minor unit for totals and validation', () => {
    const source = invoice({
      currencycode: 'JPY',
      currency: { code: 'JPY', minorunit: 0 },
      grandtotal: 1000.4,
      payments: [
        { amount: 500.4, vendorpaymentid: 'payment-1' },
        { amount: 499.6, vendorpaymentid: 'payment-2' },
      ],
    });

    expect(calculatePurchaseInvoicePaidTotal(source)).toBe(1000);
    expect(calculatePurchaseInvoiceOutstanding(source)).toBe(0);
    expect(getPurchaseInvoicePaymentDraftError(source, draft({ amount: '1' }))).toBe(
      'Amount cannot exceed outstanding balance.',
    );
  });

  it('builds an auto-numbered vendor payment payload', () => {
    expect(buildPurchaseInvoicePaymentPayload(invoice(), draft())).toEqual({
      amount: 250,
      bcashid: 'bank-1',
      cprops: { autoNumbering: true },
      currencycode: 'INR',
      date: '2026-06-18',
      invoices: [{ amount: 250, purchaseinvoiceid: 'pi-1' }],
      vendorid: 'vendor-1',
    });
  });

  it('builds a manual-numbered vendor payment payload', () => {
    expect(
      buildPurchaseInvoicePaymentPayload(
        invoice({ currencycode: undefined, currency: { code: 'USD' } }),
        draft({
          autoNumbering: false,
          description: 'Wire transfer',
          number: 'PAY-MANUAL',
        }),
      ),
    ).toEqual({
      amount: 250,
      bcashid: 'bank-1',
      cprops: { autoNumbering: false },
      currencycode: 'USD',
      date: '2026-06-18',
      description: 'Wire transfer',
      invoices: [{ amount: 250, purchaseinvoiceid: 'pi-1' }],
      number: 'PAY-MANUAL',
      vendorid: 'vendor-1',
    });
  });

  it('rejects invalid inline payment drafts', () => {
    expect(getPurchaseInvoicePaymentDraftError(invoice(), draft({ bankCashId: '' }))).toBe(
      'Bank/Cash account is required.',
    );
    expect(getPurchaseInvoicePaymentDraftError(invoice(), draft({ amount: '0' }))).toBe(
      'Amount must be greater than 0.',
    );
    expect(getPurchaseInvoicePaymentDraftError(invoice(), draft({ amount: '1000.01' }))).toBe(
      'Amount cannot exceed outstanding balance.',
    );
    expect(
      getPurchaseInvoicePaymentDraftError(invoice(), draft({ autoNumbering: false, number: '' })),
    ).toBe('Payment number is required.');
  });
});
