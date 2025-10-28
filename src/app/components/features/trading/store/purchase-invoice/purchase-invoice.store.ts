// purchase-invoice.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { PurchaseInvoice } from './purchase-invoice.model';

export const PurchaseInvoiceStore = createBaseListStore<PurchaseInvoice>('purchase-invoice');

