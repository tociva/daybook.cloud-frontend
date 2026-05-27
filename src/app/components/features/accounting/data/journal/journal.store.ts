import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  Journal,
  JournalCreatePayload,
  JournalGetQuery,
  JournalListQuery,
  JournalUpdatePayload,
} from './journal.model';
import { JournalService } from './journal.service';
import { initialJournalState } from './journal.state';

export const JournalStore = signalStore(
  { providedIn: 'root' },
  withState(initialJournalState),
  withComputed(({ journal }) => ({
    count: computed(() => journal().count),
    error: computed(() => journal().error),
    isLoading: computed(() => journal().isLoading),
    items: computed(() => journal().items),
    selectedItem: computed(() => journal().selectedItem),
  })),
  withMethods((store, service = inject(JournalService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        journal: { ...state.journal, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        journal: { ...state.journal, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          journal: { ...state.journal, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          journal: { ...state.journal, selectedItem: null },
        }));
      },
      setSelectedItem(journal: Journal): void {
        patchState(store, (state) => ({
          journal: { ...state.journal, selectedItem: journal },
        }));
      },

      async createJournal(payload: JournalCreatePayload): Promise<Journal | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            journal: {
              ...state.journal,
              count: state.journal.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.journal.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create journal.'));
          return null;
        }
      },

      async deleteJournal(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            journal: {
              ...state.journal,
              count: Math.max(state.journal.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.journal.items.filter((i) => i.id !== id),
              selectedItem: state.journal.selectedItem?.id === id ? null : state.journal.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete journal.'));
          return false;
        }
      },

      async loadJournalById(id: string, query?: JournalGetQuery): Promise<Journal | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            journal: {
              ...state.journal,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load journal.'));
          return null;
        }
      },

      async loadJournals(query?: JournalListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            journal: { ...state.journal, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load journals.'));
        }
      },

      async updateJournal(id: string, payload: JournalUpdatePayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, payload);
          const item = await service.getById(id, { includes: ['entries', 'documents'] });
          patchState(store, (state) => ({
            journal: {
              ...state.journal,
              error: null,
              isLoading: false,
              selectedItem: item,
              items: state.journal.items.some((j) => j.id === id)
                ? state.journal.items.map((j) => (j.id === id ? item : j))
                : state.journal.items,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update journal.'));
          return false;
        }
      },
    };
  }),
);
