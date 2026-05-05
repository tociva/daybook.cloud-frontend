import type { Branch } from '../../../management/data/branch/branch.model';
import type { Lb4ListQuery } from '../../../../../shared/crud';
import type { TaxGroup } from '../tax-group/tax-group.model';

export type ItemType = 'Product' | 'Service';

export type ItemCategoryPayload = Readonly<{
  name: string;
  code: string;
  type: ItemType;
  description?: string;
  parentid?: string;
  taxgroupid?: string;
}>;

export type ItemCategory = ItemCategoryPayload &
  Readonly<{
    id?: string;
    parent?: ItemCategory;
    children?: readonly ItemCategory[];
    branch?: Branch;
    branchid?: string;
    taxgroup?: TaxGroup;
  }>;

export type ItemCategoryListQuery = Lb4ListQuery;

export type ItemCategoryGetQuery = Readonly<{
  includes?: readonly string[];
}>;
