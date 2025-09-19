import { Branch } from '../../../management/store/branch/branch.model';
import { TaxGroupJSON } from '../../../../../util/types/tax-group.type';

export interface TaxGroupCU {
  name: string;
  rate: number;
  description?: string;
  groups: TaxGroupJSON[];
}

export interface TaxGroup extends TaxGroupCU {
  id?: string;
  branch: Branch;
  branchid: string;
}
