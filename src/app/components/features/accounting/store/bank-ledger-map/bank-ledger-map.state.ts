import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { BankCashLedgerMap } from './bank-ledger-map.model';

export type BankLedgerMapModel = BaseListModel<BankCashLedgerMap>;

export const initialBankLedgerMapState: BankLedgerMapModel = createInitialBaseListState<BankCashLedgerMap>();

