import { applyCachedCrudListQuery, type Lb4ListQuery } from '../../../../../shared/crud';
import type { Vendor } from './vendor.model';

export function applyVendorListQuery(
  catalog: readonly Vendor[],
  query: Lb4ListQuery = {},
): { count: number; items: readonly Vendor[] } {
  return applyCachedCrudListQuery(catalog, query, {
    readFieldValue: (vendor, field) => {
      if (field === 'city') return vendor.address?.city ?? '';
      return vendor[field as keyof Vendor];
    },
    readSortValue: (vendor, field) => {
      if (field === 'city') return vendor.address?.city ?? '';
      return vendor[field as keyof Vendor];
    },
  });
}
