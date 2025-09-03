import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { Vendor } from './vendor.model';

export type VendorModel = BaseListModel<Vendor>;

export const initialVendorState: VendorModel = createInitialBaseListState<Vendor>();
