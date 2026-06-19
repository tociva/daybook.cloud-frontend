import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { BankCash } from '../bank-cash';

export type ContraTransactionCustomProperties = Readonly<{
  [key: string]: unknown;
}>;

export type ContraTransactionSystemProperties = Readonly<{
  [key: string]: unknown;
}>;

export type ContraTransactionPayload = Readonly<{
  amount: number;
  cprops?: ContraTransactionCustomProperties;
  currencycode: string;
  date: string;
  description?: string;
  frombcashid: string;
  sprops?: ContraTransactionSystemProperties;
  tobcashid: string;
}>;

export type ContraTransaction = ContraTransactionPayload &
  Readonly<{
    branchid?: string;
    frombcash?: BankCash;
    id?: string;
    tobcash?: BankCash;
  }>;

export type ContraTransactionJournal = Readonly<{
  id: string;
  number: string;
}>;

export type ContraTransactionListQuery = Lb4ListQuery;
export type ContraTransactionGetQuery = Readonly<{ includes?: readonly Lb4Include[] }>;
