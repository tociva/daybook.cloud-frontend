import { createActionGroup, props } from '@ngrx/store';
import { Organization, OrganizationBootstrap } from './organization.model';

export const organizationActions = createActionGroup({
  source: 'Organization',
  events: {
    loadOrganizations: props<{ query?: unknown }>(),
    loadOrganizationsSuccess: props<{ organizations: Organization[]}>(),
    loadOrganizationsFailure: props<{ error: unknown }>(),
    
    bootstrapOrganization: props<{ organization: OrganizationBootstrap }>(),
    bootstrapOrganizationSuccess: props<{ organization: Organization }>(),
    bootstrapOrganizationFailure: props<{ error: unknown }>()
  }
});