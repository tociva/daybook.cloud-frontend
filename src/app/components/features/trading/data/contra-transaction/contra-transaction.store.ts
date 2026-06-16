import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  ContraTransaction,
  ContraTransactionGetQuery,
  ContraTransactionListQuery,
  ContraTransactionPayload,
} from './contra-transaction.model';
import { ContraTransactionService } from './contra-transaction.service';
import { initialContraTransactionState } from './contra-transaction.state';

export const ContraTransactionStore = signalStore(
  { providedIn: 'root' },
  withState(initialContraTransactionState),
  withComputed(({ contraTransaction }) => ({
    count: computed(() => contraTransaction().count),
    error: computed(() => contraTransaction().error),
    isLoading: computed(() => contraTransaction().isLoading),
    items: computed(() => contraTransaction().items),
    selectedItem: computed(() => contraTransaction().selectedItem),
  })),
  withMethods((store, service = inject(ContraTransactionService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        contraTransaction: {
          ...state.contraTransaction,
          error: null,
          isLoading: true,
        },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        contraTransaction: {
          ...state.contraTransaction,
          error,
          isLoading: false,
        },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          contraTransaction: { ...state.contraTransaction, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          contraTransaction: { ...state.contraTransaction, selectedItem: null },
        }));
      },
      setSelectedItem(contraTransaction: ContraTransaction): void {
        patchState(store, (state) => ({
          contraTransaction: { ...state.contraTransaction, selectedItem: contraTransaction },
        }));
      },
      async createContraTransaction(
        payload: ContraTransactionPayload,
      ): Promise<ContraTransaction | null> {
        setLoading();

        try {
          const contraTransaction = await service.create(payload);
          patchState(store, (state) => ({
            contraTransaction: {
              ...state.contraTransaction,
              count: state.contraTransaction.count + 1,
              error: null,
              isLoading: false,
              items: [contraTransaction, ...state.contraTransaction.items],
              selectedItem: contraTransaction,
            },
          }));

          return contraTransaction;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create bank contra transaction.'));
          return null;
        }
      },
      async deleteContraTransaction(id: string): Promise<boolean> {
        setLoading();

        try {
          await service.delete(id);
          patchState(store, (state) => ({
            contraTransaction: {
              ...state.contraTransaction,
              count: Math.max(state.contraTransaction.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.contraTransaction.items.filter((item) => item.id !== id),
              selectedItem:
                state.contraTransaction.selectedItem?.id === id
                  ? null
                  : state.contraTransaction.selectedItem,
            },
          }));

          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete bank contra transaction.'));
          return false;
        }
      },
      async loadContraTransactionById(
        id: string,
        query?: ContraTransactionGetQuery,
      ): Promise<ContraTransaction | null> {
        setLoading();

        try {
          const contraTransaction = await service.getById(id, query);
          patchState(store, (state) => ({
            contraTransaction: {
              ...state.contraTransaction,
              error: null,
              isLoading: false,
              selectedItem: contraTransaction,
            },
          }));

          return contraTransaction;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load bank contra transaction.'));
          return null;
        }
      },
      async loadContraTransactions(query: ContraTransactionListQuery = {}): Promise<void> {
        setLoading();

        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            contraTransaction: {
              ...state.contraTransaction,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load bank contra transactions.'));
        }
      },
      async updateContraTransaction(
        id: string,
        payload: ContraTransactionPayload,
      ): Promise<boolean> {
        setLoading();

        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.contraTransaction.items.find((item) => item.id === id);
            const selected =
              state.contraTransaction.selectedItem?.id === id
                ? state.contraTransaction.selectedItem
                : null;
            const mergedItem = mergeContraTransaction(existing ?? selected, payload);

            return {
              contraTransaction: {
                ...state.contraTransaction,
                error: null,
                isLoading: false,
                items: state.contraTransaction.items.map((item) =>
                  item.id === id ? (mergeContraTransaction(item, payload) ?? item) : item,
                ),
                selectedItem: mergedItem ?? state.contraTransaction.selectedItem,
              },
            };
          });

          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update bank contra transaction.'));
          return false;
        }
      },
    };
  }),
);

function mergeContraTransaction(
  item: ContraTransaction | null | undefined,
  payload: ContraTransactionPayload,
): ContraTransaction | null {
  if (!item) return null;

  const fromChanged = payload.frombcashid !== item.frombcashid;
  const toChanged = payload.tobcashid !== item.tobcashid;

  return {
    ...item,
    ...payload,
    ...(fromChanged ? { frombcash: undefined } : {}),
    ...(toChanged ? { tobcash: undefined } : {}),
  };
}
