// vendor-payment.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { VendorPayment } from './vendor-payment.model';

export const VendorPaymentStore = createBaseListStore<VendorPayment>('vendor-payment');

