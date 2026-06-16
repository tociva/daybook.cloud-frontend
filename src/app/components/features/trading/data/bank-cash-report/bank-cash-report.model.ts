export type BankCashReportQuery = Readonly<{
  bcashid?: string;
  end?: string;
  start?: string;
}>;

export type BankCashReportTotals = Readonly<{
  payment: number;
  receipt: number;
}>;

export type BankCashReportSourceType = 'contra' | 'payment' | 'receipt';

export type BankCashReportContraLeg = 'from' | 'to' | null;

export type BankCashReportTransaction = Readonly<{
  amount: number;
  bcashid: string;
  contraid?: string | null;
  contraleg?: BankCashReportContraLeg;
  counterpartyid?: string | null;
  counterpartyname?: string | null;
  counterpartytype?: string | null;
  currencycode?: string;
  date: string;
  description?: string;
  payment: number;
  receipt: number;
  sourceid: string;
  sourcetype: BankCashReportSourceType;
  transactiongroupid: string;
}>;

export type BankCashReport = Readonly<{
  bcashid?: string | null;
  end?: string | null;
  start?: string | null;
  totals: BankCashReportTotals;
  transactions: readonly BankCashReportTransaction[];
}>;
