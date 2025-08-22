import { createInitialBaseListState } from '../../../../../util/store/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list.model';
import { Customer } from './customer.model';

export type CustomerModel = BaseListModel<Customer>;

export const initialCustomerState: CustomerModel = createInitialBaseListState<Customer>();
