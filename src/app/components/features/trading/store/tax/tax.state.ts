import { createInitialBaseListState } from '../../../../../util/store/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list.model';
import { Tax } from './tax.model';

export type TaxModel = BaseListModel<Tax>;

export const initialTaxState: TaxModel = createInitialBaseListState<Tax>();
