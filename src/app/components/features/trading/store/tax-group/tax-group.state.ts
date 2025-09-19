import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { TaxGroup } from './tax-group.model';

export type TaxGroupModel = BaseListModel<TaxGroup>;

export const initialTaxGroupState: TaxGroupModel = createInitialBaseListState<TaxGroup>();
