import { createAction, props } from '@ngrx/store';
import { Organization, OrganizationBootstrap } from './organization.model';

export const loadOrganizations = createAction('[Organization] Load Organizations', props<{ query?: unknown }>());
export const loadOrganizationsSuccess = createAction('[Organization] Load Organizations Success', props<{ organizations: Organization[]}>());
export const loadOrganizationsFailure = createAction('[Organization] Load Organizations Failure', props<{ error: unknown }>());

export const bootstrapOrganization = createAction('[Organization] Bootstrap Organization', props<{ organization: OrganizationBootstrap }>());
export const bootstrapOrganizationSuccess = createAction('[Organization] Bootstrap Organization Success', props<{ organization: Organization }>());
export const bootstrapOrganizationFailure = createAction('[Organization] Bootstrap Organization Failure', props<{ error: unknown }>());