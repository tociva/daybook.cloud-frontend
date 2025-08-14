import { createActionGroup, props } from '@ngrx/store';
import { Organization, OrganizationBootstrap } from './organization.model';
import { DbcError } from '../../../../../util/types/dbc-error.type';

export const organizationActions = createActionGroup({
  source: 'Organization',
  events: {
    loadOrganizations: props<{ query?: unknown }>(),
    loadOrganizationsSuccess: props<{ organizations: Organization[]}>(),
    loadOrganizationsFailure: props<{ error: DbcError }>(),
    
    bootstrapOrganization: props<{ organization: OrganizationBootstrap }>(),
    bootstrapOrganizationSuccess: props<{ organization: Organization }>(),
    bootstrapOrganizationFailure: props<{ error: DbcError }>()
  }
});