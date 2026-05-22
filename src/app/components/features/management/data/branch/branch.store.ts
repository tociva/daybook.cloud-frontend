import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type { Branch, BranchGetQuery, BranchListQuery, BranchPayload } from './branch.model';
import { BranchService } from './branch.service';
import { initialBranchState } from './branch.state';

export const BranchStore = signalStore(
  { providedIn: 'root' },
  withState(initialBranchState),
  withComputed(
    ({
      branches,
      selectedBranch,
      selectedBranchId,
      organizationId,
      count,
      isLoading,
      error,
      search,
    }) => ({
      branches: computed(() => branches()),
      count: computed(() => count()),
      error: computed(() => error()),
      isLoading: computed(() => isLoading()),
      items: computed(() => branches()),
      organizationId: computed(() => organizationId()),
      search: computed(() => search()),
      selectedBranch: computed(() => selectedBranch()),
      selectedBranchId: computed(() => selectedBranchId()),
      selectedItem: computed(() => selectedBranch()),
    }),
  ),
  withMethods((store, service = inject(BranchService)) => {
    const setLoading = (): void => {
      patchState(store, { error: null, isLoading: true });
    };

    const setError = (error: string): void => {
      patchState(store, { error, isLoading: false });
    };

    return {
      clear(): void {
        patchState(store, initialBranchState);
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      setOrganizationId(organizationId: string | null): void {
        patchState(store, { organizationId });
      },

      setSearch(search: string): void {
        patchState(store, { search });
      },

      async loadBranches(query: BranchListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [branches, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, { branches, count, error: null, isLoading: false });
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load branches.'));
        }
      },

      async loadBranchById(id: string, query?: BranchGetQuery): Promise<Branch | null> {
        setLoading();
        try {
          const branch = await service.getById(id, query);
          patchState(store, {
            selectedBranch: branch,
            selectedBranchId: branch.id ?? null,
            error: null,
            isLoading: false,
          });
          return branch;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load branch.'));
          return null;
        }
      },

      async createBranch(payload: BranchPayload): Promise<Branch | null> {
        setLoading();
        try {
          const branch = await service.create(payload);
          patchState(store, (state) => ({
            branches: [branch, ...state.branches],
            count: state.count + 1,
            selectedBranch: branch,
            selectedBranchId: branch.id ?? null,
            error: null,
            isLoading: false,
          }));
          return branch;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create branch.'));
          return null;
        }
      },

      async updateBranch(id: string, payload: BranchPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, { error: null, isLoading: false });
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update branch.'));
          return false;
        }
      },

      async deleteBranch(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            branches: state.branches.filter((b) => b.id !== id),
            count: Math.max(state.count - 1, 0),
            selectedBranch: state.selectedBranch?.id === id ? null : state.selectedBranch,
            selectedBranchId: state.selectedBranchId === id ? null : state.selectedBranchId,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete branch.'));
          return false;
        }
      },
    };
  }),
);
