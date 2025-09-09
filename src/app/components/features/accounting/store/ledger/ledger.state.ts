import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { Ledger } from './ledger.model';

export type LedgerModel = BaseListModel<Ledger>;

export const initialLedgerState: LedgerModel = createInitialBaseListState<Ledger>();
