// customer.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list.store';
import { Customer } from './customer.model';

export const CustomerStore = createBaseListStore<Customer>('customer');
