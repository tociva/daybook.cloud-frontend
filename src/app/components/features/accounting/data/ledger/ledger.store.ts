import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Ledger, LedgerGetQuery, LedgerListQuery, LedgerPayload } from './ledger.model';
import { LedgerService } from './ledger.service';
import { initialLedgerState } from './ledger.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const LedgerStore = signalStore(
  { providedIn: 'root' },
  withState(initialLedgerState),
  withComputed(({ ledger }) => ({
    count: computed(() => ledger().count),
    error: computed(() => ledger().error),
    isLoading: computed(() => ledger().isLoading),
    items: computed(() => ledger().items),
    selectedItem: computed(() => ledger().selectedItem),
  })),
  withMethods((store, service = inject(LedgerService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        ledger: { ...state.ledger, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        ledger: { ...state.ledger, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          ledger: { ...state.ledger, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          ledger: { ...state.ledger, selectedItem: null },
        }));
      },
      setSelectedItem(ledger: Ledger): void {
        patchState(store, (state) => ({
          ledger: { ...state.ledger, selectedItem: ledger },
        }));
      },

      async createLedger(payload: LedgerPayload): Promise<Ledger | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            ledger: {
              ...state.ledger,
              count: state.ledger.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.ledger.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create ledger.'));
          return null;
        }
      },

      async deleteLedger(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            ledger: {
              ...state.ledger,
              count: Math.max(state.ledger.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.ledger.items.filter((i) => i.id !== id),
              selectedItem: state.ledger.selectedItem?.id === id ? null : state.ledger.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete ledger.'));
          return false;
        }
      },

      async loadLedgerById(id: string, query?: LedgerGetQuery): Promise<Ledger | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            ledger: {
              ...state.ledger,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load ledger.'));
          return null;
        }
      },

      async loadLedgers(query?: LedgerListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            ledger: { ...state.ledger, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load ledgers.'));
        }
      },

      async updateLedger(id: string, payload: LedgerPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            ledger: {
              ...state.ledger,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update ledger.'));
          return false;
        }
      },
    };
  }),
);
