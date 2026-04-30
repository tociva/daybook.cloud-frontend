import type { Branch } from '../../../management/data/branch/branch.model';

export enum Status {
  INACTIVE = 0,
  ACTIVE = 1,
  DELETED = 2,
}

export type BankCashStatus = Status;

export type BankCashPayload = Readonly<{
  description?: string;
  name: string;
  props?: Readonly<{ ledger?: string } & Record<string, unknown>>;
  status?: BankCashStatus;
}>;

export type BankCash = BankCashPayload &
  Readonly<{
    branch?: Branch;
    branchid?: string;
    id?: string;
  }>;

export type BankCashListQuery = Readonly<{
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
}>;

export type BankCashCount = Readonly<{
  count: number;
}>;
