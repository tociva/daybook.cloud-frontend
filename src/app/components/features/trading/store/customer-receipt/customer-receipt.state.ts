import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { CustomerReceipt } from './customer-receipt.model';

export type CustomerReceiptModel = BaseListModel<CustomerReceipt>;

export const initialCustomerReceiptState: CustomerReceiptModel = createInitialBaseListState<CustomerReceipt>();

