import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { UserSession } from './user-session.model';

export const userSessionActions = createActionGroup({
  source: 'UserSession',
  events: {
    createUserSession: emptyProps(),
    createUserSessionSuccess: props<{ session: UserSession }>(),
    createUserSessionFailure: props<{ error: any }>(),
    
    selectOrganization: props<{ organizationid: string }>(),
    selectBranch: props<{ branchid: string }>(),
    selectFiscalYear: props<{ fiscalyearid: string }>(),
    selectOrganizations: emptyProps(),
    
    clearUserSession: emptyProps(),
    clearUserSessionSuccess: emptyProps(),
    clearUserSessionFailure: props<{ error: any }>(),
  }
});
