// purchase-invoice.state.ts
import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { PurchaseInvoice } from './purchase-invoice.model';

export type PurchaseInvoiceModel = BaseListModel<PurchaseInvoice>;

export const initialPurchaseInvoiceState: PurchaseInvoiceModel = createInitialBaseListState;

