import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { FiscalYear } from './fiscal-year.model';
import { initialFiscalYearState } from './fiscal-year.state';

export const FiscalYearStore = signalStore(
  { providedIn: 'root' },
  withState(initialFiscalYearState),
  withComputed(({ fiscalYears, selectedFiscalYearId, branchId, isLoading, error, search }) => ({
    fiscalYears: computed(() => fiscalYears()),
    selectedFiscalYearId: computed(() => selectedFiscalYearId()),
    selectedFiscalYear: computed(
      () => fiscalYears().find((item) => item.id === selectedFiscalYearId()) ?? null,
    ),
    branchId: computed(() => branchId()),
    isLoading: computed(() => isLoading()),
    error: computed(() => error()),
    search: computed(() => search()),
  })),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialFiscalYearState);
    },
    setBranchId(branchId: string | null): void {
      patchState(store, { branchId });
    },
    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },
    setFiscalYears(fiscalYears: readonly FiscalYear[]): void {
      patchState(store, { fiscalYears, error: null, isLoading: false });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    setSearch(search: string): void {
      patchState(store, { search });
    },
    setSelectedFiscalYearId(selectedFiscalYearId: string | null): void {
      patchState(store, { selectedFiscalYearId });
    },
    upsertFiscalYear(fiscalYear: FiscalYear): void {
      patchState(store, (state) => {
        const idx = state.fiscalYears.findIndex((item) => item.id === fiscalYear.id);
        if (idx === -1) {
          return { fiscalYears: [...state.fiscalYears, fiscalYear] };
        }

        return {
          fiscalYears: state.fiscalYears.map((item, index) =>
            index === idx ? fiscalYear : item,
          ),
        };
      });
    },
  })),
);

