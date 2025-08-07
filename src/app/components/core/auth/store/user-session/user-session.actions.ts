import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { UserSession } from './user-session.model';

export const userSessionActions = createActionGroup({
  source: 'UserSession',
  events: {
    loadUserSession: props<{ userid: string }>(),
    loadUserSessionSuccess: props<{ session: UserSession }>(),
    loadUserSessionFailure: props<{ error: any }>(),
    
    createUserSession: emptyProps(),
    
    selectOrganization: props<{ organizationid: string }>(),
    selectBranch: props<{ branchid: string }>(),
    selectFiscalYear: props<{ fiscalyearid: string }>(),
    selectOrganizations: emptyProps(),
    
    deleteUserSession: props<{ id: string }>(),
    clearUserSession: emptyProps()
  }
});
