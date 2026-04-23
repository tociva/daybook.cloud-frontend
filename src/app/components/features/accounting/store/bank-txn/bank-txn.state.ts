import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { BankTxn } from './bank-txn.model';

export type BankTxnModel = BaseListModel<BankTxn>;

export const initialBankTxnState: BankTxnModel = createInitialBaseListState<BankTxn>();


