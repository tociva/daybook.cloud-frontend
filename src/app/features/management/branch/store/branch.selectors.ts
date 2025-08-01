import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BranchState } from './branch.reducer';

export const selectBranchState = createFeatureSelector<BranchState>('branch');

export const selectBranchs = createSelector(
  selectBranchState,
  (state) => state.branchs
);

export const selectBranchsCount = createSelector(
  selectBranchState,
  (state) => state.count
);

export const selectBranchError = createSelector(
  selectBranchState,
  (state) => state.error
);
