// bank-cash.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list.store';
import { BankCash } from './bank-cash.model';

export const BankCashStore = createBaseListStore<BankCash>('bank-cash');
