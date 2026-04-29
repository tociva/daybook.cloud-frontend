import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Branch } from './branch.model';
import { initialBranchState } from './branch.state';

export const BranchStore = signalStore(
  { providedIn: 'root' },
  withState(initialBranchState),
  withComputed(({ branches, selectedBranchId, organizationId, isLoading, error, search }) => ({
    branches: computed(() => branches()),
    selectedBranchId: computed(() => selectedBranchId()),
    selectedBranch: computed(() => branches().find((branch) => branch.id === selectedBranchId()) ?? null),
    organizationId: computed(() => organizationId()),
    isLoading: computed(() => isLoading()),
    error: computed(() => error()),
    search: computed(() => search()),
  })),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialBranchState);
    },
    setBranches(branches: readonly Branch[]): void {
      patchState(store, { branches, error: null, isLoading: false });
    },
    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    setOrganizationId(organizationId: string | null): void {
      patchState(store, { organizationId });
    },
    setSearch(search: string): void {
      patchState(store, { search });
    },
    setSelectedBranchId(selectedBranchId: string | null): void {
      patchState(store, { selectedBranchId });
    },
    upsertBranch(branch: Branch): void {
      patchState(store, (state) => {
        const idx = state.branches.findIndex((item) => item.id === branch.id);
        if (idx === -1) {
          return { branches: [...state.branches, branch] };
        }

        return {
          branches: state.branches.map((item, index) => (index === idx ? branch : item)),
        };
      });
    },
  })),
);

