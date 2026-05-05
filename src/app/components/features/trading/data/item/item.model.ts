import type { Branch } from '../../../management/data/branch/branch.model';
import type { Lb4ListQuery } from '../../../../../shared/crud';
import type { ItemCategory } from '../item-category/item-category.model';

export type ItemPayload = Readonly<{
  name: string;
  code: string;
  displayname: string;
  categoryid: string;
  barcode?: string;
  description?: string;
  purchaseledger?: string;
  salesledger?: string;
}>;

export type Item = ItemPayload &
  Readonly<{
    id?: string;
    category?: ItemCategory;
    branch?: Branch;
    branchid?: string;
  }>;

export type ItemListQuery = Lb4ListQuery;

export type ItemGetQuery = Readonly<{
  includes?: readonly string[];
}>;
