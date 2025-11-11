// purchase-return.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { PurchaseReturn } from './purchase-return.model';

export const PurchaseReturnStore = createBaseListStore<PurchaseReturn>('purchase-return');

