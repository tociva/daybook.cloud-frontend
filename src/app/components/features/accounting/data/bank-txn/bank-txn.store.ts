import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type { BankTxn, BankTxnGetQuery, BankTxnListQuery, BankTxnPayload } from './bank-txn.model';
import { BankTxnService } from './bank-txn.service';
import { initialBankTxnState } from './bank-txn.state';

export const BankTxnStore = signalStore(
  { providedIn: 'root' },
  withState(initialBankTxnState),
  withComputed(({ bankTxn }) => ({
    count: computed(() => bankTxn().count),
    error: computed(() => bankTxn().error),
    isLoading: computed(() => bankTxn().isLoading),
    items: computed(() => bankTxn().items),
    selectedItem: computed(() => bankTxn().selectedItem),
  })),
  withMethods((store, service = inject(BankTxnService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        bankTxn: { ...state.bankTxn, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        bankTxn: { ...state.bankTxn, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          bankTxn: { ...state.bankTxn, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          bankTxn: { ...state.bankTxn, selectedItem: null },
        }));
      },

      async createBankTxn(payload: BankTxnPayload): Promise<BankTxn | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            bankTxn: {
              ...state.bankTxn,
              count: state.bankTxn.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.bankTxn.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create bank transaction.'));
          return null;
        }
      },

      async deleteBankTxn(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            bankTxn: {
              ...state.bankTxn,
              count: Math.max(state.bankTxn.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.bankTxn.items.filter((item) => item.id !== id),
              selectedItem:
                state.bankTxn.selectedItem?.id === id ? null : state.bankTxn.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete bank transaction.'));
          return false;
        }
      },

      async loadBankTxnById(id: string, query?: BankTxnGetQuery): Promise<BankTxn | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            bankTxn: {
              ...state.bankTxn,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load bank transaction.'));
          return null;
        }
      },

      async loadBankTxns(query?: BankTxnListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            bankTxn: {
              ...state.bankTxn,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load bank transactions.'));
        }
      },

      async updateBankTxn(id: string, payload: BankTxnPayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          patchState(store, (state) => ({
            bankTxn: {
              ...state.bankTxn,
              error: null,
              isLoading: false,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update bank transaction.'));
          return false;
        }
      },
    };
  }),
);
