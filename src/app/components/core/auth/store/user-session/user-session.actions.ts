import { createAction, props } from '@ngrx/store';
import { UserSession } from './user-session.model';

export const loadUserSession = createAction('[UserSession] Load User Session', props<{ userid: string }>());
export const loadUserSessionSuccess = createAction('[UserSession] Load User Session Success', props<{ session: UserSession }>());
export const loadUserSessionFailure = createAction('[UserSession] Load User Session Failure', props<{ error: any }>());

export const createUserSession = createAction('[UserSession] Create User Session');

export const selectOrganization = createAction('[UserSession] Select Organization', props<{ organizationid: string }>());
export const selectBranch = createAction('[UserSession] Select Branch', props<{ branchid: string }>());
export const selectFiscalYear = createAction('[UserSession] Select Fiscal Year', props<{ fiscalyearid: string }>());
export const selectOrganizations = createAction('[UserSession] Select Organizations');

export const deleteUserSession = createAction('[UserSession] Delete User Session', props<{ id: string }>());
export const clearUserSession = createAction('[UserSession] Clear User Session');
