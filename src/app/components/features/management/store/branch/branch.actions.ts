import { createActionGroup, props } from '@ngrx/store';
import { Branch } from './branch.model';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { Count } from '../../../../../util/lb4-query-builder';  

export const branchActions = createActionGroup({
  source: 'Branch',
  events: {
    loadBranches: props<{ query?: QueryParamsRep }>(),
    loadBranchesSuccess: props<{ branches: Branch[]}>(),
    loadBranchesFailure: props<{ error: DbcError }>(),

    loadBranchById: props<{ id: string }>(),
    loadBranchByIdSuccess: props<{ branch: Branch }>(),
    loadBranchByIdFailure: props<{ error: DbcError }>(),

    createBranch: props<{ branch: Branch }>(),
    createBranchSuccess: props<{ branch: Branch }>(),
    createBranchFailure: props<{ error: DbcError }>(),

    countBranches: props<{ query?: QueryParamsRep }>(),
    countBranchesSuccess: props<{ count: Count }>(),
    countBranchesFailure: props<{ error: DbcError }>(),

    updateBranch: props<{ id: string; branch: Branch }>(),
    updateBranchSuccess: props<{ branch: Branch }>(),
    updateBranchFailure: props<{ error: DbcError }>(),

    deleteBranch: props<{ id: string }>(),
    deleteBranchSuccess: props<{ id: string }>(),
    deleteBranchFailure: props<{ error: DbcError }>(),
  }
});