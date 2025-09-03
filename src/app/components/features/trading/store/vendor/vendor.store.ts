// vendor.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { Vendor } from './vendor.model';

export const VendorStore = createBaseListStore<Vendor>('vendor');
