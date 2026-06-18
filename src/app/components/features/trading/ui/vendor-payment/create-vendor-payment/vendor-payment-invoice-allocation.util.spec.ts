import { describe, expect, it } from 'vitest';
import type { PurchaseInvoice } from '../../../data/purchase-invoice/purchase-invoice.model';
import {
  allocationTotal,
  invoiceBalanceSummary,
  isPaymentRemainingNegative,
  outstandingBalance,
  paymentRemaining,
  validateVendorPaymentInvoiceAllocations,
} from './vendor-payment-invoice-allocation.util';

function invoice(overrides: Partial<PurchaseInvoice> = {}): PurchaseInvoice {
  return {
    id: 'pi-1',
    number: 'PI-001',
    date: '2026-04-01',
    grandtotal: 10000,
    payments: [{ amount: 7000, vendorpaymentid: 'vpmt-old' }],
    ...overrides,
  };
}

describe('vendor payment invoice allocation helpers', () => {
  it('uses invoice outstanding balance for allocation prefill', () => {
    expect(outstandingBalance(invoice())).toBe(3000);
  });

  it('excludes the current vendor payment when calculating editable outstanding balance', () => {
    const editableInvoice = invoice({
      payments: [
        { amount: 7000, vendorpaymentid: 'vpmt-old' },
        { amount: 2000, vendorpaymentid: 'vpmt-current' },
      ],
    });

    expect(outstandingBalance(editableInvoice)).toBe(1000);
    expect(outstandingBalance(editableInvoice, { currentVendorPaymentId: 'vpmt-current' })).toBe(
      3000,
    );
  });

  it('sums selected invoice allocations and calculates payment remaining', () => {
    const rows = [
      { invoice: invoice(), amount: 1500 },
      {
        invoice: invoice({ id: 'pi-2', number: 'PI-002', grandtotal: 2000, payments: [] }),
        amount: 500,
      },
      { invoice: null, amount: 9999 },
    ];

    expect(allocationTotal(rows)).toBe(2000);
    expect(paymentRemaining(2500, rows)).toBe(500);
    expect(isPaymentRemainingNegative(1000, rows)).toBe(true);
  });

  it('formats invoice option balance text with total and outstanding values', () => {
    expect(invoiceBalanceSummary(invoice(), 'INR')).toBe(
      'Total INR 10000.00 / Outstanding INR 3000.00',
    );
  });

  it('blocks allocation above the payment amount', () => {
    expect(
      validateVendorPaymentInvoiceAllocations(
        [{ invoice: invoice({ payments: [] }), amount: 4000 }],
        3000,
        { currencycode: 'INR' },
      ),
    ).toBe('Allocated total INR 4000.00 cannot exceed payment amount INR 3000.00.');
  });

  it('blocks allocation above the invoice outstanding balance', () => {
    expect(
      validateVendorPaymentInvoiceAllocations([{ invoice: invoice(), amount: 4000 }], 5000, {
        currencycode: 'INR',
      }),
    ).toBe('Allocation for purchase invoice PI-001 cannot exceed outstanding balance INR 3000.00.');
  });

  it('blocks duplicate and non-positive invoice allocations', () => {
    expect(
      validateVendorPaymentInvoiceAllocations(
        [
          { invoice: invoice(), amount: 1000 },
          { invoice: invoice(), amount: 500 },
        ],
        2000,
      ),
    ).toBe('Purchase invoice PI-001 is selected more than once.');

    expect(validateVendorPaymentInvoiceAllocations([{ invoice: invoice(), amount: 0 }], 2000)).toBe(
      'Allocation for purchase invoice PI-001 must be greater than 0.',
    );
  });

  it('accepts a valid partial allocation', () => {
    expect(
      validateVendorPaymentInvoiceAllocations([{ invoice: invoice(), amount: 2500 }], 3000, {
        currencycode: 'INR',
      }),
    ).toBeNull();
  });
});
