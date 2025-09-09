// ledger.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { Ledger } from './ledger.model';

export const LedgerStore = createBaseListStore<Ledger>('ledger');
