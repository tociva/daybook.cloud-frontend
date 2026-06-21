import type {
  BalanceSheetData,
  BalanceSheetItem,
} from '../../../data/balance-sheet/balance-sheet.model';

const CURRENT_YEAR_PROFIT_NAME = 'Current Year Profit';

export function hasComputedCurrentYearCapitalRow(data: BalanceSheetData): boolean {
  return data.capital.some(
    (item) => item.computed === true && item.name === CURRENT_YEAR_PROFIT_NAME,
  );
}

export function getBalanceSheetCapitalRows(data: BalanceSheetData): readonly BalanceSheetItem[] {
  if (data.capital.length > 0 || hasComputedCurrentYearCapitalRow(data)) {
    return data.capital;
  }

  if (data.adjustments.currentYearProfit > 0) {
    return [
      {
        ledgerid: '',
        name: CURRENT_YEAR_PROFIT_NAME,
        category: 'Adjustment',
        amount: data.adjustments.currentYearProfit,
        computed: true,
      },
    ];
  }

  return data.capital;
}

export function shouldShowLegacyCurrentYearLoss(data: BalanceSheetData): boolean {
  return (
    !hasComputedCurrentYearCapitalRow(data) &&
    data.adjustments.currentYearProfit <= 0 &&
    data.adjustments.currentYearLoss > 0
  );
}
