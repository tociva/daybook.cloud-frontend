// customer-receipt.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { CustomerReceipt } from './customer-receipt.model';

export const CustomerReceiptStore = createBaseListStore<CustomerReceipt>('customer-receipt');

