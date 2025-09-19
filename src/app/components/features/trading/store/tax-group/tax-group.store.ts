// tax-group.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { TaxGroup } from './tax-group.model';

export const TaxGroupStore = createBaseListStore<TaxGroup>('tax-group');
