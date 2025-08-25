// tax.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { Tax } from './tax.model';

export const TaxStore = createBaseListStore<Tax>('tax');
