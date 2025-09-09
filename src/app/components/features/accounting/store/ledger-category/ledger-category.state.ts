import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { LedgerCategory } from './ledger-category.model';

export type LedgerCategoryModel = BaseListModel<LedgerCategory>;

export const initialLedgerCategoryState: LedgerCategoryModel = createInitialBaseListState<LedgerCategory>();
