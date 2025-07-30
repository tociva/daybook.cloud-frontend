import { createAction, props } from '@ngrx/store';
import { Branch } from './branch.models';

export const loadBranchs = createAction('[Branch] Load Branchs', props<{ query?: any }>());
export const loadBranchsSuccess = createAction('[Branch] Load Branchs Success', props<{ branchs: Branch[], count: number }>());
export const loadBranchsFailure = createAction('[Branch] Load Branchs Failure', props<{ error: any }>());
