import { applyCachedCrudListQuery, type Lb4ListQuery } from '../../../../../shared/crud';
import type { Customer } from './customer.model';

export function applyCustomerListQuery(
  catalog: readonly Customer[],
  query: Lb4ListQuery = {},
): { count: number; items: readonly Customer[] } {
  return applyCachedCrudListQuery(catalog, query, {
    readFieldValue: (customer, field) => {
      if (field === 'city') return customer.address?.city ?? '';
      return customer[field as keyof Customer];
    },
    readSortValue: (customer, field) => {
      if (field === 'city') return customer.address?.city ?? '';
      return customer[field as keyof Customer];
    },
  });
}
