import { createReducer, on } from '@ngrx/store';
import * as BranchActions from './branch.actions';
import { Branch } from './branch.models';

export interface BranchState {
  branchs: Branch[];
  count: number;
  error: any;
}

export const initialState: BranchState = {
  branchs: [],
  count: 0,
  error: null,
};

export const branchReducer = createReducer(
  initialState,
  on(BranchActions.loadBranchsSuccess, (state, { branchs, count }) => ({
    ...state,
    branchs,
    count,
    error: null,
  })),
  on(BranchActions.loadBranchsFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
