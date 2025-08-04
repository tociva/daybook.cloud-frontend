import { createInitialBaseListState } from '../../../../../../util/base-list.initial';
import { BaseListModel } from '../../../../../../util/base-list.model';
import { Branch } from './branch.model';

export type BranchModel = BaseListModel<Branch>;

export const initialBranchState: BranchModel = createInitialBaseListState<Branch>(); 