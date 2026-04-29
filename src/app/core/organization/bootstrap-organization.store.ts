import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { initialBootstrapOrganizationState } from './bootstrap-organization.state';

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
  withMethods((store, http = inject(HttpClient)) => ({
    async bootstrapOrganization(
      apiBaseUrl: string,
      payload: BootstrapOrganizationPayload,
    ): Promise<void> {
      if (store.isLoading()) {
        return;
      }

      patchState(store, { isLoading: true, error: null });

      try {
        const headers = new HttpHeaders({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        });

        await firstValueFrom(
          http.post<unknown>(
            `${apiBaseUrl.replace(/\/$/, '')}/organization/organization/bootstrap-with-data`,
            payload,
            { headers },
          ),
        );

        patchState(store, { isLoading: false, error: null });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to create organization. Please try again.';
        patchState(store, { isLoading: false, error: message });
        throw new Error(message);
      }
    },
  })),
);
