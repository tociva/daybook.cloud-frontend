import type { Branch } from '../../../management/data/branch/branch.model';
import type { Lb4ListQuery } from '../../../../../shared/crud';

export enum Status {
  INACTIVE = 0,
  ACTIVE = 1,
  DELETED = 2,
}

export type TaxStatus = Status;

export type TaxPayload = Readonly<{
  appliedto: number;
  description?: string;
  name: string;
  rate: number;
  shortname: string;
  status?: TaxStatus;
}>;

export type Tax = TaxPayload &
  Readonly<{
    branch?: Branch;
    branchid?: string;
    id?: string;
  }>;

export type TaxListQuery = Lb4ListQuery;

