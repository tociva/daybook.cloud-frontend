import { createInitialBaseListState } from '../../../../../util/store/base-list.initial';
import { BaseListModel } from '../../../../../util/store/base-list.model';
import { Branch } from './branch.model';

export type BranchModel = BaseListModel<Branch>;

export const initialBranchState: BranchModel = createInitialBaseListState<Branch>(); 