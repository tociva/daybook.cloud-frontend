import type { Branch } from '../branch/branch.model';
import type { Currency } from '../currency/currency.model';
import type { Lb4ListQuery } from '../../../../../shared/crud';

export type FiscalYear = Readonly<{
  id?: string;
  name?: string;
  startdate: string;
  enddate: string;
  freezetill?: string | null;
  jnumber?: string;
  currencycode?: string;
  currency?: Currency;
  branchid?: string;
  branch?: Branch;
  createdat?: Date;
  updatedat?: Date;
}>;

export type FiscalYearPayload = Readonly<{
  name: string;
  startdate: string;
  enddate: string;
  jnumber: string;
  currencycode: string;
  branchid: string;
  freezetill?: string | null;
}>;

export type FiscalYearListQuery = Lb4ListQuery;
export type FiscalYearGetQuery = Readonly<{ includes?: readonly string[] }>;
