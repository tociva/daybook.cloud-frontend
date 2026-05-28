export type TrialBalanceItem = Readonly<{
  ledgerid: string;
  name: string;
  openingDebit: number | null;
  openingCredit: number | null;
  runningDebit: number | null;
  runningCredit: number | null;
  closingDebit: number | null;
  closingCredit: number | null;
}>;

export type TrialBalanceReport = Readonly<{
  title: string;
  updatedAt: string;
  data: readonly TrialBalanceItem[];
}>;

export type TrialBalanceListQuery = {
  start?: string;
  end?: string;
};
