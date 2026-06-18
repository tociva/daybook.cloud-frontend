import { describe, expect, it } from 'vitest';
import {
  formatAmountForCurrency,
  getCurrencyMinorUnit,
  roundMoneyForCurrency,
  toMinorUnits,
} from './currency';

describe('currency money helpers', () => {
  it('uses the currency relation minor unit before Intl defaults', () => {
    expect(getCurrencyMinorUnit('USD', { code: 'USD', minorunit: 3 })).toBe(3);
    expect(roundMoneyForCurrency(12.3456, 'USD', { code: 'USD', minorunit: 3 })).toBe(12.346);
  });

  it('derives common currency minor units from Intl', () => {
    expect(getCurrencyMinorUnit('INR')).toBe(2);
    expect(getCurrencyMinorUnit('USD')).toBe(2);
    expect(getCurrencyMinorUnit('JPY')).toBe(0);
  });

  it('falls back to two decimals when currency precision cannot be resolved', () => {
    expect(getCurrencyMinorUnit(undefined)).toBe(2);
    expect(getCurrencyMinorUnit('INVALID')).toBe(2);
    expect(formatAmountForCurrency(12.345, undefined)).toBe('12.35');
  });

  it('rounds and formats using the resolved currency minor unit', () => {
    expect(roundMoneyForCurrency(12.345, 'INR')).toBe(12.35);
    expect(roundMoneyForCurrency(12.6, 'JPY')).toBe(13);
    expect(formatAmountForCurrency(12.6, 'JPY')).toBe('13');
  });

  it('compares the reported INR payment total in minor units', () => {
    const paid = 1343.8 + 241.88;
    const grandtotal = 1585.68;

    expect(paid).not.toBe(grandtotal);
    expect(toMinorUnits(paid, 'INR', { code: 'INR', minorunit: 2 })).toBe(
      toMinorUnits(grandtotal, 'INR', { code: 'INR', minorunit: 2 }),
    );
  });
});
