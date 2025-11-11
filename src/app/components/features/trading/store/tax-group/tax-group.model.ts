import { Branch } from '../../../management/store/branch/branch.model';
import { TaxGroupJSON } from '../../../../../util/types/tax-group.type';
import { TaxBulkRequestItem } from '../tax/tax.model';

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

export interface TaxGroupBulkRequestItem {
  name: string;
  rate: number;
  description?: string;
  groups?: Array<{
    mode: string;
    taxes: string[];
  }>;
}

export interface TaxGroupBulkRequest {
  taxes?: TaxBulkRequestItem[];
  taxgroups: TaxGroupBulkRequestItem[];
}
