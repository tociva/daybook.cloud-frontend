import { createAction, props } from '@ngrx/store';
import { Branch } from './branch.model';

export const loadBranches = createAction('[Branch] Load Branches', props<{ query?: any }>());
export const loadBranchesSuccess = createAction('[Branch] Load Branches Success', props<{ branches: Branch[], count: number }>());
export const loadBranchesFailure = createAction('[Branch] Load Branches Failure', props<{ error: any }>()); 