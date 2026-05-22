import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type { TaxGroup, TaxGroupListQuery, TaxGroupPayload } from './tax-group.model';
import { TaxGroupService } from './tax-group.service';
import { initialTaxGroupState } from './tax-group.state';

export const TaxGroupStore = signalStore(
  { providedIn: 'root' },
  withState(initialTaxGroupState),
  withComputed(({ taxGroup }) => ({
    count: computed(() => taxGroup().count),
    error: computed(() => taxGroup().error),
    isLoading: computed(() => taxGroup().isLoading),
    items: computed(() => taxGroup().items),
    selectedItem: computed(() => taxGroup().selectedItem),
  })),
  withMethods((store, service = inject(TaxGroupService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        taxGroup: {
          ...state.taxGroup,
          error: null,
          isLoading: true,
        },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        taxGroup: {
          ...state.taxGroup,
          error,
          isLoading: false,
        },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          taxGroup: { ...state.taxGroup, error: null },
        }));
      },
      getAvailableModes(): string[] {
        return Array.from(
          new Set(
            store
              .items()
              .flatMap((item) => item.groups ?? [])
              .map((group) => group.mode?.trim())
              .filter((mode): mode is string => Boolean(mode)),
          ),
        );
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          taxGroup: {
            ...state.taxGroup,
            selectedItem: null,
          },
        }));
      },
      setSelectedItem(taxGroup: TaxGroup): void {
        patchState(store, (state) => ({
          taxGroup: { ...state.taxGroup, selectedItem: taxGroup },
        }));
      },
      async createTaxGroup(payload: TaxGroupPayload): Promise<TaxGroup | null> {
        setLoading();

        try {
          const taxGroup = await service.create(payload);
          patchState(store, (state) => ({
            taxGroup: {
              ...state.taxGroup,
              count: state.taxGroup.count + 1,
              error: null,
              isLoading: false,
              items: [taxGroup, ...state.taxGroup.items],
              selectedItem: taxGroup,
            },
          }));

          return taxGroup;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create tax group.'));
          return null;
        }
      },
      async deleteTaxGroup(id: string): Promise<boolean> {
        setLoading();

        try {
          await service.delete(id);
          patchState(store, (state) => ({
            taxGroup: {
              ...state.taxGroup,
              count: Math.max(state.taxGroup.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.taxGroup.items.filter((item) => item.id !== id),
              selectedItem:
                state.taxGroup.selectedItem?.id === id ? null : state.taxGroup.selectedItem,
            },
          }));

          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete tax group.'));
          return false;
        }
      },
      async loadTaxGroupById(id: string): Promise<TaxGroup | null> {
        setLoading();

        try {
          const taxGroup = await service.getById(id);
          patchState(store, (state) => ({
            taxGroup: {
              ...state.taxGroup,
              error: null,
              isLoading: false,
              selectedItem: taxGroup,
            },
          }));

          return taxGroup;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load tax group.'));
          return null;
        }
      },
      async loadTaxGroups(query?: TaxGroupListQuery): Promise<void> {
        setLoading();

        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            taxGroup: {
              ...state.taxGroup,
              count,
              error: null,
              isLoading: false,
              items,
            },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load tax groups.'));
        }
      },
      async updateTaxGroup(id: string, payload: TaxGroupPayload): Promise<boolean> {
        setLoading();

        try {
          await service.update(id, payload);
          patchState(store, (state) => {
            const existing = state.taxGroup.items.find((item) => item.id === id);
            const mergedItem = existing ? { ...existing, ...payload } : state.taxGroup.selectedItem;
            return {
              taxGroup: {
                ...state.taxGroup,
                error: null,
                isLoading: false,
                items: state.taxGroup.items.map((item) =>
                  item.id === id ? { ...item, ...payload } : item,
                ),
                selectedItem: mergedItem,
              },
            };
          });

          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update tax group.'));
          return false;
        }
      },
    };
  }),
);
