export type TaxReportAmount = Readonly<{
  debit: number;
  credit: number;
}>;

export type TaxReportMonth = Readonly<{
  month: string;
  year: number;
  taxes: Readonly<Record<string, TaxReportAmount>>;
}>;

export type TaxReportQuery = Readonly<{
  start: string;
  end: string;
}>;

export type TaxReportResponse = Readonly<{
  title: string;
  generatedAt: string;
  data: readonly TaxReportMonth[];
}>;
