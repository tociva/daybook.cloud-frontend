// bank-txn.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { BankTxn } from './bank-txn.model';

export const BankTxnStore = createBaseListStore<BankTxn>('bank-txn');


