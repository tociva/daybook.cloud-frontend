import { createInitialBaseListState } from '../../../../../util/store/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list.model';
import { BankCash } from './bank-cash.model';

export type BankCashModel = BaseListModel<BankCash>;

export const initialBankCashState: BankCashModel = createInitialBaseListState<BankCash>();
