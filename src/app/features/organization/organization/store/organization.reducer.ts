import { createReducer, on } from '@ngrx/store';
import * as OrganizationActions from './organization.actions';
import { Organization } from './organization.models';

export interface OrganizationState {
  organizations: Organization[];
  count: number;
  error: any;
}

export const initialState: OrganizationState = {
  organizations: [],
  count: 0,
  error: null,
};

export const organizationReducer = createReducer(
  initialState,
  on(OrganizationActions.loadOrganizationsSuccess, (state, { organizations, count }) => ({
    ...state,
    organizations,
    count,
    error: null,
  })),
  on(OrganizationActions.loadOrganizationsFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
