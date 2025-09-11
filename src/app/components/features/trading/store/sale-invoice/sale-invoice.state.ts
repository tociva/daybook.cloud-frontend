// sale-invoice.state.ts
import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { SaleInvoice } from './sale-invoice.model';

export type SaleInvoiceModel = BaseListModel<SaleInvoice>;

export const initialSaleInvoiceState: SaleInvoiceModel = createInitialBaseListState<SaleInvoice>();
