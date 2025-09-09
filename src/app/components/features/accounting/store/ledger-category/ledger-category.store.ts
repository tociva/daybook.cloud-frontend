// ledger-category.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { LedgerCategory } from './ledger-category.model';

export const LedgerCategoryStore = createBaseListStore<LedgerCategory>('ledgerCategory');
