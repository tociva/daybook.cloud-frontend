import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type {
  FiscalYear,
  FiscalYearGetQuery,
  FiscalYearListQuery,
  FiscalYearPayload,
} from './fiscal-year.model';
import { FiscalYearService } from './fiscal-year.service';
import { initialFiscalYearState } from './fiscal-year.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const FiscalYearStore = signalStore(
  { providedIn: 'root' },
  withState(initialFiscalYearState),
  withComputed(
    ({
      fiscalYears,
      selectedFiscalYear,
      selectedFiscalYearId,
      branchId,
      count,
      isLoading,
      error,
      search,
    }) => ({
      branchId: computed(() => branchId()),
      count: computed(() => count()),
      error: computed(() => error()),
      fiscalYears: computed(() => fiscalYears()),
      isLoading: computed(() => isLoading()),
      items: computed(() => fiscalYears()),
      search: computed(() => search()),
      selectedFiscalYear: computed(() => selectedFiscalYear()),
      selectedFiscalYearId: computed(() => selectedFiscalYearId()),
      selectedItem: computed(() => selectedFiscalYear()),
    }),
  ),
  withMethods((store, service = inject(FiscalYearService)) => {
    const setLoading = (): void => {
      patchState(store, { error: null, isLoading: true });
    };
    const setError = (error: string): void => {
      patchState(store, { error, isLoading: false });
    };

    return {
      clear(): void {
        patchState(store, initialFiscalYearState);
      },

      clearError(): void {
        patchState(store, { error: null });
      },

      setBranchId(branchId: string | null): void {
        patchState(store, { branchId });
      },

      setSearch(search: string): void {
        patchState(store, { search });
      },

      async loadFiscalYears(query: FiscalYearListQuery = {}): Promise<void> {
        setLoading();
        try {
          const [fiscalYears, count] = await Promise.all([
            service.list(query),
            service.count(query),
          ]);
          patchState(store, { fiscalYears, count, error: null, isLoading: false });
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load fiscal years.'));
        }
      },

      async loadFiscalYearById(id: string, query?: FiscalYearGetQuery): Promise<FiscalYear | null> {
        setLoading();
        try {
          const fiscalYear = await service.getById(id, query);
          patchState(store, {
            selectedFiscalYear: fiscalYear,
            selectedFiscalYearId: fiscalYear.id ?? null,
            error: null,
            isLoading: false,
          });
          return fiscalYear;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load fiscal year.'));
          return null;
        }
      },

      async createFiscalYear(payload: FiscalYearPayload): Promise<FiscalYear | null> {
        setLoading();
        try {
          const fiscalYear = await service.create(payload);
          patchState(store, (state) => ({
            fiscalYears: [fiscalYear, ...state.fiscalYears],
            count: state.count + 1,
            selectedFiscalYear: fiscalYear,
            selectedFiscalYearId: fiscalYear.id ?? null,
            error: null,
            isLoading: false,
          }));
          return fiscalYear;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create fiscal year.'));
          return null;
        }
      },

      async updateFiscalYear(id: string, payload: FiscalYearPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, { error: null, isLoading: false });
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update fiscal year.'));
          return false;
        }
      },

      async deleteFiscalYear(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            fiscalYears: state.fiscalYears.filter((fy) => fy.id !== id),
            count: Math.max(state.count - 1, 0),
            selectedFiscalYear:
              state.selectedFiscalYear?.id === id ? null : state.selectedFiscalYear,
            selectedFiscalYearId:
              state.selectedFiscalYearId === id ? null : state.selectedFiscalYearId,
            error: null,
            isLoading: false,
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete fiscal year.'));
          return false;
        }
      },
    };
  }),
);
