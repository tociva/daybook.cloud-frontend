import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { Customer } from './customer.model';

export type CustomerModel = BaseListModel<Customer>;

export const initialCustomerState: CustomerModel = createInitialBaseListState<Customer>();
