import { Branch } from '../../../management/store/branch/branch.model';
import { TaxGroup } from '../tax-group/tax-group.model';
export type ItemType = 'Product' | 'Service';

export interface ItemCategoryCU {
  name: string;
  code: string;
  type: ItemType;
  description?: string;
  props?: Record<string, unknown>;
  parentid?: string;
  taxgroupid?: string;
}

export interface ItemCategory extends ItemCategoryCU {
  id?: string;
  parent?: ItemCategory;
  children?: ItemCategory[];
  branch: Branch;
  branchid: string;
  taxgroup?: TaxGroup;
}
