// sale-invoice.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { SaleInvoice } from './sale-invoice.model';

export const SaleInvoiceStore = createBaseListStore<SaleInvoice>('sale-invoice');
