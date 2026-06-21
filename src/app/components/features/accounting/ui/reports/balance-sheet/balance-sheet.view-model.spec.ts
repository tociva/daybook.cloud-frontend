import { describe, expect, it } from 'vitest';
import type { BalanceSheetData } from '../../../data/balance-sheet';
import {
  getBalanceSheetCapitalRows,
  hasComputedCurrentYearCapitalRow,
  shouldShowLegacyCurrentYearLoss,
} from './balance-sheet.view-model';

const data = (override: Partial<BalanceSheetData> = {}): BalanceSheetData => ({
  assets: [],
  liabilities: [],
  capital: [],
  adjustments: { currentYearProfit: 0, currentYearLoss: 0 },
  totals: {
    assets: 0,
    liabilities: 0,
    capital: 0,
    liabilitiesAndEquity: 0,
    currentYearProfit: 0,
    currentYearLoss: 0,
  },
  ...override,
});

describe('balance sheet view model', () => {
  it.each([12345, -12345])(
    'uses computed Current Year Profit capital rows for amount %s',
    (amount) => {
      const reportData = data({
        capital: [
          {
            ledgerid: '',
            name: 'Current Year Profit',
            category: 'Capital / Equity',
            amount,
            computed: true,
          },
        ],
        adjustments: {
          currentYearProfit: amount > 0 ? amount : 0,
          currentYearLoss: amount < 0 ? Math.abs(amount) : 0,
        },
        totals: {
          assets: 0,
          liabilities: 0,
          capital: amount,
          liabilitiesAndEquity: amount,
          currentYearProfit: amount > 0 ? amount : 0,
          currentYearLoss: amount < 0 ? Math.abs(amount) : 0,
        },
      });

      expect(hasComputedCurrentYearCapitalRow(reportData)).toBe(true);
      expect(getBalanceSheetCapitalRows(reportData)).toEqual(reportData.capital);
      expect(shouldShowLegacyCurrentYearLoss(reportData)).toBe(false);
    },
  );

  it('falls back to a legacy adjustment row for current-year profit only when capital is absent', () => {
    const reportData = data({
      adjustments: { currentYearProfit: 100, currentYearLoss: 0 },
    });

    expect(getBalanceSheetCapitalRows(reportData)).toEqual([
      {
        ledgerid: '',
        name: 'Current Year Profit',
        category: 'Adjustment',
        amount: 100,
        computed: true,
      },
    ]);
  });

  it('keeps legacy current-year loss on the assets side when no computed capital row exists', () => {
    const reportData = data({
      adjustments: { currentYearProfit: 0, currentYearLoss: 100 },
    });

    expect(shouldShowLegacyCurrentYearLoss(reportData)).toBe(true);
  });
});
