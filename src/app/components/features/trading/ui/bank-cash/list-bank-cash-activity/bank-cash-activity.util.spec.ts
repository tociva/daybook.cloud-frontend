import { describe, expect, it } from 'vitest';
import type { BankCashReportTransaction } from '../../../data/bank-cash-report';
import { buildBankCashReportHttpParams } from '../../../data/bank-cash-report';
import {
  formatContraLeg,
  formatSourceType,
  normalizeBankCashReportTransaction,
} from './bank-cash-activity.util';

const transaction = (
  overrides: Partial<BankCashReportTransaction> = {},
): BankCashReportTransaction => ({
  amount: 100,
  bcashid: 'bank-1',
  contraid: null,
  contraleg: null,
  counterpartyid: 'customer-1',
  counterpartyname: 'Acme Retail',
  counterpartytype: 'customer',
  currencycode: 'INR',
  date: '2026-05-02',
  description: 'Customer receipt',
  payment: 0,
  receipt: 100,
  sourceid: 'receipt-1',
  sourcetype: 'receipt',
  transactiongroupid: 'receipt:receipt-1',
  ...overrides,
});

describe('bank cash report helpers', () => {
  it('builds report query params and omits empty filters', () => {
    const params = buildBankCashReportHttpParams({
      bcashid: 'bank-1',
      end: '2026-05-31',
      start: '2026-05-01',
    });

    expect(params.get('bcashid')).toBe('bank-1');
    expect(params.get('start')).toBe('2026-05-01');
    expect(params.get('end')).toBe('2026-05-31');

    const empty = buildBankCashReportHttpParams({ bcashid: '', start: '', end: '' });
    expect(empty.keys()).toEqual([]);
  });

  it('normalizes receipt rows as inflow source links', () => {
    expect(normalizeBankCashReportTransaction(transaction())).toMatchObject({
      amount: 100,
      bankCashId: 'bank-1',
      contraId: null,
      contraLeg: '',
      counterpartyName: 'Acme Retail',
      description: 'Customer receipt',
      payment: 0,
      receipt: 100,
      sourceId: 'receipt-1',
      sourceLabel: 'Receipt',
      sourceRoute: ['/app/trading/customer-receipt', 'receipt-1'],
      sourceType: 'receipt',
    });
  });

  it('normalizes payment rows as outflow source links', () => {
    expect(
      normalizeBankCashReportTransaction(
        transaction({
          amount: 75,
          counterpartyid: 'vendor-1',
          counterpartyname: 'Paper Supply Co',
          counterpartytype: 'vendor',
          description: 'Vendor payment',
          payment: 75,
          receipt: 0,
          sourceid: 'payment-1',
          sourcetype: 'payment',
          transactiongroupid: 'payment:payment-1',
        }),
      ),
    ).toMatchObject({
      counterpartyName: 'Paper Supply Co',
      payment: 75,
      receipt: 0,
      sourceId: 'payment-1',
      sourceLabel: 'Payment',
      sourceRoute: ['/app/trading/vendor-payment', 'payment-1'],
      sourceType: 'payment',
    });
  });

  it('normalizes contra rows with leg labels and contra links', () => {
    expect(
      normalizeBankCashReportTransaction(
        transaction({
          contraid: 'contra-1',
          contraleg: 'from',
          counterpartyid: 'bank-2',
          counterpartyname: 'Main Bank',
          counterpartytype: 'bankCash',
          description: 'Cash deposit to bank',
          payment: 500,
          receipt: 0,
          sourceid: 'contra-1',
          sourcetype: 'contra',
          transactiongroupid: 'contra:contra-1',
        }),
      ),
    ).toMatchObject({
      contraId: 'contra-1',
      contraLeg: 'From',
      counterpartyName: 'Main Bank',
      payment: 500,
      receipt: 0,
      sourceLabel: 'Contra',
      sourceRoute: ['/app/trading/bank-cash/contra', 'contra-1'],
      sourceType: 'contra',
    });
  });

  it('formats source and contra leg labels', () => {
    expect(formatSourceType('receipt')).toBe('Receipt');
    expect(formatSourceType('payment')).toBe('Payment');
    expect(formatSourceType('contra')).toBe('Contra');
    expect(formatContraLeg('from')).toBe('From');
    expect(formatContraLeg('to')).toBe('To');
    expect(formatContraLeg(null)).toBe('');
  });
});
