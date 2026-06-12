import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { ItemCategory, ItemCategoryListQuery } from './item-category.model';

export type ItemCategoryQueryResult = CachedCrudQueryResult<ItemCategory>;

export function applyItemCategoryListQuery(
  catalog: readonly ItemCategory[],
  query: ItemCategoryListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): ItemCategoryQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
    defaultLimit,
    readFieldValue,
    readSortValue,
  });
}

function readFieldValue(category: ItemCategory, field: string): unknown {
  switch (field) {
    case 'parent':
      return category.parent?.name ?? '';
    case 'taxgroup':
      return category.taxgroup?.name ?? '';
    default:
      return (category as Record<string, unknown>)[field] ?? '';
  }
}

function readSortValue(category: ItemCategory, field: string): unknown {
  return readFieldValue(category, field);
}
