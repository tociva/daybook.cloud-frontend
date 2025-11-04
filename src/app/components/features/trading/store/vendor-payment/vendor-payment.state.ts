import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { VendorPayment } from './vendor-payment.model';

export type VendorPaymentModel = BaseListModel<VendorPayment>;

export const initialVendorPaymentState: VendorPaymentModel = createInitialBaseListState<VendorPayment>();

