import { createActionGroup, props } from '@ngrx/store';
import { Organization, OrganizationBootstrap } from './organization.model';
import { DbcError } from '../../../../../util/types/dbc-error.type';
import { QueryParamsRep } from '../../../../../util/query-params-util';
import { Count } from '../../../../../util/lb4-query-builder';

export const organizationActions = createActionGroup({
  source: 'Organization',
  events: {
    loadOrganizations: props<{ query?: QueryParamsRep }>(),
    loadOrganizationsSuccess: props<{ organizations: Organization[]}>(),
    loadOrganizationsFailure: props<{ error: DbcError }>(),

    loadOrganizationById: props<{ id: string }>(),
    loadOrganizationByIdSuccess: props<{ organization: Organization }>(),
    loadOrganizationByIdFailure: props<{ error: DbcError }>(),

    createOrganization: props<{ organization: Organization }>(),
    createOrganizationSuccess: props<{ organization: Organization }>(),
    createOrganizationFailure: props<{ error: DbcError }>(),

    countOrganizations: props<{ query?: QueryParamsRep }>(),
    countOrganizationsSuccess: props<{ count: Count }>(),
    countOrganizationsFailure: props<{ error: DbcError }>(),

    updateOrganization: props<{ id: string; organization: Organization }>(),
    updateOrganizationSuccess: props<{ organization: Organization }>(),
    updateOrganizationFailure: props<{ error: DbcError }>(),

    deleteOrganization: props<{ id: string }>(),
    deleteOrganizationSuccess: props<{ id: string }>(),
    deleteOrganizationFailure: props<{ error: DbcError }>(),
    
    bootstrapOrganization: props<{ organization: OrganizationBootstrap }>(),
    bootstrapOrganizationSuccess: props<{ organization: Organization }>(),
    bootstrapOrganizationFailure: props<{ error: DbcError }>()
  }
});