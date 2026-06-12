import {
  DEFAULT_LB4_PAGE_SIZE,
  applyCachedCrudListQuery,
  type CachedCrudQueryResult,
} from '../../../../../shared/crud';
import type { Item, ItemListQuery } from './item.model';

export type ItemQueryResult = CachedCrudQueryResult<Item>;

export function applyItemListQuery(
  catalog: readonly Item[],
  query: ItemListQuery = {},
  defaultLimit = DEFAULT_LB4_PAGE_SIZE,
): ItemQueryResult {
  return applyCachedCrudListQuery(catalog, query, {
    defaultLimit,
    readFieldValue: readItemFieldValue,
    readSortValue: readItemSortValue,
  });
}

function readItemFieldValue(item: Item, field: string): unknown {
  switch (field) {
    case 'category':
      return item.category?.name ?? '';
    default:
      return (item as Record<string, unknown>)[field] ?? '';
  }
}

function readItemSortValue(item: Item, field: string): unknown {
  return readItemFieldValue(item, field);
}
