import { createAction, props } from '@ngrx/store';
import { Organization } from './organization.models';

export const loadOrganizations = createAction('[Organization] Load Organizations', props<{ query?: any }>());
export const loadOrganizationsSuccess = createAction('[Organization] Load Organizations Success', props<{ organizations: Organization[], count: number }>());
export const loadOrganizationsFailure = createAction('[Organization] Load Organizations Failure', props<{ error: any }>());
