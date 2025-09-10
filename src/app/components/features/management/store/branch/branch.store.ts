import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { Branch } from './branch.model';

export const BranchStore = createBaseListStore<Branch>('branch');
