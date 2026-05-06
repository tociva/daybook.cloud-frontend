import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { BankCash, BankCashListQuery, BankCashPayload } from './bank-cash.model';
import { BankCashService } from './bank-cash.service';
import { initialBankCashState } from './bank-cash.state';

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const BankCashStore = signalStore(
  { providedIn: 'root' },
  withState(initialBankCashState),
  withComputed(({ bankCash }) => ({
    count: computed(() => bankCash().count),
    error: computed(() => bankCash().error),
    isLoading: computed(() => bankCash().isLoading),
    items: computed(() => bankCash().items),
    selectedItem: computed(() => bankCash().selectedItem),
  })),
  withMethods((store, service = inject(BankCashService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        bankCash: {
          ...state.bankCash,
          error: null,
          isLoading: true,
        },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        bankCash: {
          ...state.bankCash,
          error,
          isLoading: false,
        },
      }));
    };

    return {
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          bankCash: {
            ...state.bankCash,
            selectedItem: null,
          },
        }));
      },
      async createBankCash(payload: BankCashPayload): Promise<BankCash | null> {
        setLoading();

        try {
          const bankCash = await service.create(payload);
          patchState(store, (state) => ({
            bankCash: {
              ...state.bankCash,
              count: state.bankCash.count + 1,
              error: null,
              isLoading: false,
              items: [bankCash, ...state.bankCash.items],
              selectedItem: bankCash,
            },
          }));

          return bankCash;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to create bank/cash account.'));
          return null;
        }
      },
      async deleteBankCash(id: string): Promise<boolean> {
        setLoading();

        try {
          await service.delete(id);
          patchState(store, (state) => ({
            bankCash: {
              ...state.bankCash,
              count: Math.max(state.bankCash.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.bankCash.items.filter((item) => item.id !== id),
              selectedItem:
                state.bankCash.selectedItem?.id === id ? null : state.bankCash.selectedItem,
            },
          }));

          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to delete bank/cash account.'));
          return false;
        }
      },
      async loadBankCashById(id: string): Promise<BankCash | null> {
        setLoading();

        try {
          const bankCash = await service.getById(id);
          patchState(store, (state) => ({
            bankCash: {
              ...state.bankCash,
              error: null,
              isLoading: false,
              selectedItem: bankCash,
            },
          }));

          return bankCash;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load bank/cash account.'));
          return null;
        }
      },
      async loadBankCashes(query?: BankCashListQuery): Promise<void> {
        setLoading();

        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            bankCash: {
              ...state.bankCash,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to load bank/cash accounts.'));
        }
      },
      async updateBankCash(id: string, payload: BankCashPayload): Promise<boolean> {
        setLoading();

        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const updated = state.bankCash.items.find((item) => item.id === id);
            const mergedItem = updated ? { ...updated, ...payload } : state.bankCash.selectedItem;
            return {
              bankCash: {
                ...state.bankCash,
                error: null,
                isLoading: false,
                items: state.bankCash.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });

          return true;
        } catch (error) {
          setError(getErrorMessage(error, 'Failed to update bank/cash account.'));
          return false;
        }
      },
    };
  }),
);
