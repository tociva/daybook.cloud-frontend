import { createActionGroup, props } from '@ngrx/store';
import { Branch } from './branch.model';

export const branchActions = createActionGroup({
  source: 'Branch',
  events: {
    loadBranches: props<{ query?: any }>(),
    loadBranchesSuccess: props<{ branches: Branch[], count: number }>(),
    loadBranchesFailure: props<{ error: any }>()
  }
}); 