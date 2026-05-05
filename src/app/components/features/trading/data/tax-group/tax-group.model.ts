import type { Branch } from '../../../management/data/branch/branch.model';
import type { Lb4ListQuery } from '../../../../../shared/crud';

/** Create/update payload shape (groups use explicit tax ids). */
export type TaxGroupJSON = Readonly<{
  mode: string;
  taxids: readonly string[];
}>;

export type TaxGroupCU = Readonly<{
  description?: string;
  groups: readonly TaxGroupJSON[];
  name: string;
  rate: number;
}>;

export type TaxGroupItem = Readonly<{
  mode: string;
  taxids?: readonly string[];
  taxes?: readonly string[];
}>;

export type TaxGroupPayload = Readonly<{
  description?: string;
  groups: readonly TaxGroupItem[];
  name: string;
  rate: number;
}>;

export type TaxGroup = Readonly<{
  branch?: Branch;
  branchid?: string;
  description?: string;
  groups?: readonly TaxGroupItem[];
  id?: string;
  name: string;
  rate: number;
}>;

export type TaxGroupListQuery = Lb4ListQuery;
