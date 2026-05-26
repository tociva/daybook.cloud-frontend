import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { normalizeApiError } from '../../../../../core/api/api-error.util';
import { initialBootstrapOrganizationState } from './bootstrap-organization.state';
import type { Organization } from './organization.model';

export type BootstrapOrganizationPayload = Readonly<{
  name: string;
  email: string;
  mobile?: string;
  address: {
    city: string;
    line1: string;
    line2: string;
    pincode: string;
  };
  description?: string;
  countrycode: string;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  startdate: string;
  enddate: string;
  gstin?: string;
  invnumber: string;
  recnumber: string;
  currencycode: string;
  jnumber: string;
  dateformat: string;
}>;

export const BootstrapOrganizationStore = signalStore(
  { providedIn: 'root' },
  withState(initialBootstrapOrganizationState),
  withComputed(({ error, isLoading }) => ({
    error: computed(() => error()),
    isLoading: computed(() => isLoading()),
  })),
  withMethods((store, api = inject(ApiClientService)) => ({
    async bootstrapOrganization(
      apiBaseUrl: string,
      payload: BootstrapOrganizationPayload,
    ): Promise<Organization | null> {
      if (store.isLoading()) {
        return null;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const organization = await api.post<Organization, BootstrapOrganizationPayload>(
          `${apiBaseUrl.replace(/\/$/, '')}/organization/organization/bootstrap-with-data`,
          payload,
        );

        patchState(store, { isLoading: false, error: null });
        return organization;
      } catch (error) {
        const apiError = normalizeApiError(error, {
          fallbackMessage: 'Failed to create organization. Please try again.',
        });
        patchState(store, { isLoading: false, error: apiError.message });
        throw apiError;
      }
    },
  })),
);
