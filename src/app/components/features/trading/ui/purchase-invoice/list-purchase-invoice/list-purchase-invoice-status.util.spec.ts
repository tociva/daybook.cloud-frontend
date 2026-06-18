import { describe, expect, it } from 'vitest';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import {
  isPurchaseInvoiceOverdue,
  isPurchaseInvoicePaid,
  totalPurchaseInvoicePaid,
} from './list-purchase-invoice-status.util';

function invoice(overrides: Partial<PurchaseInvoice> = {}): PurchaseInvoice {
  return {
    id: 'pi-1',
    currencycode: 'INR',
    currency: { code: 'INR', minorunit: 2 },
    date: '2025-04-02',
    duedate: '2025-04-16',
    grandtotal: 1585.68,
    payments: [
      { amount: 1343.8, vendorpaymentid: 'payment-1' },
      { amount: 241.88, vendorpaymentid: 'payment-2' },
    ],
    vendorid: 'vendor-1',
    ...overrides,
  };
}

describe('purchase invoice list status helpers', () => {
  it('marks the reported floating-point INR payment total as paid, not overdue', () => {
    const row = invoice();

    expect(totalPurchaseInvoicePaid(row)).toBe(1585.68);
    expect(isPurchaseInvoicePaid(row)).toBe(true);
    expect(isPurchaseInvoiceOverdue(row, new Date('2026-06-18T00:00:00.000Z'))).toBe(false);
  });

  it('marks an unpaid past-due invoice as overdue', () => {
    const row = invoice({
      grandtotal: 2000,
      payments: [{ amount: 1000, vendorpaymentid: 'payment-1' }],
    });

    expect(isPurchaseInvoicePaid(row)).toBe(false);
    expect(isPurchaseInvoiceOverdue(row, new Date('2026-06-18T00:00:00.000Z'))).toBe(true);
  });

  it('uses zero-decimal currency minor units for paid comparisons', () => {
    const row = invoice({
      currencycode: 'JPY',
      currency: { code: 'JPY', minorunit: 0 },
      grandtotal: 1000.4,
      payments: [
        { amount: 500.4, vendorpaymentid: 'payment-1' },
        { amount: 499.6, vendorpaymentid: 'payment-2' },
      ],
    });

    expect(totalPurchaseInvoicePaid(row)).toBe(1000);
    expect(isPurchaseInvoicePaid(row)).toBe(true);
  });
});
