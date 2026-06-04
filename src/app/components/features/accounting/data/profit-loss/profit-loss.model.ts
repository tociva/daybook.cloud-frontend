export type ProfitLossItem = Readonly<{
  ledgerid: string;
  name: string;
  amount: number;
}>;

export type ProfitLossTotals = Readonly<{
  directIncome: number;
  directExpense: number;
  indirectIncome: number;
  indirectExpense: number;
  unclassifiedIncome: number;
  unclassifiedExpense: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  netLoss: number;
}>;

export type ProfitLossData = Readonly<{
  directIncome: readonly ProfitLossItem[];
  directExpense: readonly ProfitLossItem[];
  indirectIncome: readonly ProfitLossItem[];
  indirectExpense: readonly ProfitLossItem[];
  unclassifiedIncome: readonly ProfitLossItem[];
  unclassifiedExpense: readonly ProfitLossItem[];
  totals: ProfitLossTotals;
}>;

export type ProfitLossReport = Readonly<{
  title: string;
  generatedAt: string;
  data: ProfitLossData;
}>;

export type ProfitLossQuery = {
  start?: string;
  end?: string;
};
