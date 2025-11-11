// purchase-return.state.ts
import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { PurchaseReturn } from './purchase-return.model';

export type PurchaseReturnModel = BaseListModel<PurchaseReturn>;

export const initialPurchaseReturnState: PurchaseReturnModel = createInitialBaseListState<PurchaseReturn>();

