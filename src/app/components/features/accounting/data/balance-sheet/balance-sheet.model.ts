export type BalanceSheetItem = Readonly<{
  ledgerid: string;
  name: string;
  category: string;
  amount: number;
  computed?: boolean;
}>;

export type BalanceSheetAdjustments = Readonly<{
  currentYearProfit: number;
  currentYearLoss: number;
}>;

export type BalanceSheetTotals = Readonly<{
  assets: number;
  liabilities: number;
  capital: number;
  liabilitiesAndEquity: number;
  currentYearProfit: number;
  currentYearLoss: number;
}>;

export type BalanceSheetData = Readonly<{
  assets: readonly BalanceSheetItem[];
  liabilities: readonly BalanceSheetItem[];
  capital: readonly BalanceSheetItem[];
  adjustments: BalanceSheetAdjustments;
  totals: BalanceSheetTotals;
}>;

export type BalanceSheetReport = Readonly<{
  title: string;
  generatedAt: string;
  data: BalanceSheetData;
}>;

export type BalanceSheetQuery = {
  end?: string;
};
