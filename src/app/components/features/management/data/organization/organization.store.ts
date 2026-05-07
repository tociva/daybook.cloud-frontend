import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  Organization,
  OrganizationListQuery,
  OrganizationPayload,
} from './organization.model';
import { OrganizationService } from './organization.service';
import { initialOrganizationState } from './organization.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const OrganizationStore = signalStore(
  { providedIn: 'root' },
  withState(initialOrganizationState),
  withComputed(
    ({
      organizations,
      selectedOrganization,
      selectedOrganizationId,
      count,
      isLoading,
      error,
      search,
    }) => ({
      count: computed(() => count()),
      error: computed(() => error()),
      isLoading: computed(() => isLoading()),
      items: computed(() => organizations()),
      organizations: computed(() => organizations()),
      search: computed(() => search()),
      selectedItem: computed(() => selectedOrganization()),
      selectedOrganization: computed(() => selectedOrganization()),
      selectedOrganizationId: computed(() => selectedOrganizationId()),
    }),
  ),
  withMethods((store, service = inject(OrganizationService)) => {
    const setLoading = (): void => {
      patchState(store, { error: null, isLoading: true });
    };

    const setError = (error: string): void => {
      patchState(store, { error, isLoading: false });
    };

    return {
      clear(): void {
        patchState(store, initialOrganizationState);
      },

      setSearch(search: string): void {
        patchState(store, { search });
      },

      async loadOrganizations(query: OrganizationListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [organizations, count] = await Promise.all([
            service.list(query),
            service.count(query),
          ]);
          patchState(store, { organizations, count, error: null, isLoading: false });
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load organizations.'));
        }
      },

      async loadOrganizationById(id: string): Promise<Organization | null> {
        setLoading();
        try {
          const org = await service.getById(id);
          patchState(store, {
            selectedOrganization: org,
            selectedOrganizationId: org.id ?? null,
            error: null,
            isLoading: false,
          });
          return org;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load organization.'));
          return null;
        }
      },

      async createOrganization(payload: OrganizationPayload): Promise<Organization | null> {
        setLoading();
        try {
          const org = await service.create(payload);
          patchState(store, (state) => ({
            organizations: [org, ...state.organizations],
            count: state.count + 1,
            selectedOrganization: org,
            selectedOrganizationId: org.id ?? null,
            error: null,
            isLoading: false,
          }));
          return org;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create organization.'));
          return null;
        }
      },

      async updateOrganization(id: string, payload: OrganizationPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, { error: null, isLoading: false });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update organization.'));
          return false;
        }
      },

      async deleteOrganization(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            organizations: state.organizations.filter((o) => o.id !== id),
            count: Math.max(state.count - 1, 0),
            selectedOrganization:
              state.selectedOrganization?.id === id ? null : state.selectedOrganization,
            selectedOrganizationId:
              state.selectedOrganizationId === id ? null : state.selectedOrganizationId,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete organization.'));
          return false;
        }
      },
    };
  }),
);
