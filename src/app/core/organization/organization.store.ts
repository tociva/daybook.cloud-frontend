import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Organization } from './organization.model';
import { initialOrganizationState } from './organization.state';

export const OrganizationStore = signalStore(
  { providedIn: 'root' },
  withState(initialOrganizationState),
  withComputed(({ organizations, selectedOrganizationId, isLoading, error, search }) => ({
    organizations: computed(() => organizations()),
    selectedOrganizationId: computed(() => selectedOrganizationId()),
    selectedOrganization: computed(
      () => organizations().find((org) => org.id === selectedOrganizationId()) ?? null,
    ),
    isLoading: computed(() => isLoading()),
    error: computed(() => error()),
    search: computed(() => search()),
  })),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialOrganizationState);
    },
    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    setOrganizations(organizations: readonly Organization[]): void {
      patchState(store, { organizations, error: null, isLoading: false });
    },
    setSearch(search: string): void {
      patchState(store, { search });
    },
    setSelectedOrganizationId(selectedOrganizationId: string | null): void {
      patchState(store, { selectedOrganizationId });
    },
    upsertOrganization(organization: Organization): void {
      patchState(store, (state) => {
        const idx = state.organizations.findIndex((org) => org.id === organization.id);
        if (idx === -1) {
          return {
            organizations: [...state.organizations, organization],
          };
        }

        return {
          organizations: state.organizations.map((org, index) =>
            index === idx ? organization : org,
          ),
        };
      });
    },
  })),
);

