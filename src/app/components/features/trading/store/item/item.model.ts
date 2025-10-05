import { Status } from '../../../../../util/types/status.type';
import { Branch } from '../../../management/store/branch/branch.model';
import { ItemCategory } from '../item-category';

export interface ItemCU {
  name: string;
  code: string;
  displayname: string;
  barcode?: string;
  status?: Status;
  description?: string;
  purchaseledger?: string;
  salesledger?: string;
  props?: Record<string, unknown>;
  categoryid: string;
}

export interface Item extends ItemCU {
  id?: string;
  category: ItemCategory;
  branch: Branch;
  branchid: string;
}
