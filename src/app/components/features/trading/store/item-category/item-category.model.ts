import { Status } from '../../../../../util/types/status.type';
import { Branch } from '../../../management/store/branch/branch.model';

export interface ItemCategoryCU {
  name: string;
  code: string;
  description?: string;
  props?: Record<string, unknown>;
  parentid?: string;
}

export interface ItemCategory extends ItemCategoryCU {
  id?: string;
  parent?: ItemCategory;
  children?: ItemCategory[];
  branch: Branch;
  branchid: string;
}
