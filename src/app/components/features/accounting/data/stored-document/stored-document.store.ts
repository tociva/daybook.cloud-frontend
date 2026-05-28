import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  StoredDocument,
  StoredDocumentCreatePayload,
  StoredDocumentGetQuery,
  StoredDocumentListQuery,
  StoredDocumentWritePayload,
} from './stored-document.model';
import { StoredDocumentService } from './stored-document.service';
import { initialStoredDocumentState } from './stored-document.state';

export const StoredDocumentStore = signalStore(
  { providedIn: 'root' },
  withState(initialStoredDocumentState),
  withComputed(({ storedDocument }) => ({
    count: computed(() => storedDocument().count),
    error: computed(() => storedDocument().error),
    isLoading: computed(() => storedDocument().isLoading),
    items: computed(() => storedDocument().items),
    selectedItem: computed(() => storedDocument().selectedItem),
  })),
  withMethods((store, service = inject(StoredDocumentService)) => {
    const setLoading = (): void => {
      patchState(store, (state) => ({
        storedDocument: { ...state.storedDocument, error: null, isLoading: true },
      }));
    };

    const setError = (error: string): void => {
      patchState(store, (state) => ({
        storedDocument: { ...state.storedDocument, error, isLoading: false },
      }));
    };

    return {
      clearError(): void {
        patchState(store, (state) => ({
          storedDocument: { ...state.storedDocument, error: null },
        }));
      },
      clearSelectedItem(): void {
        patchState(store, (state) => ({
          storedDocument: { ...state.storedDocument, selectedItem: null },
        }));
      },
      setSelectedItem(document: StoredDocument): void {
        patchState(store, (state) => ({
          storedDocument: { ...state.storedDocument, selectedItem: document },
        }));
      },

      async createDocument(payload: StoredDocumentCreatePayload): Promise<StoredDocument | null> {
        setLoading();
        try {
          const item = await service.create(payload);
          patchState(store, (state) => ({
            storedDocument: {
              ...state.storedDocument,
              count: state.storedDocument.count + 1,
              error: null,
              isLoading: false,
              items: [item, ...state.storedDocument.items],
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to create document.'));
          return null;
        }
      },

      async deleteDocument(id: string): Promise<boolean> {
        setLoading();
        try {
          await service.delete(id);
          patchState(store, (state) => ({
            storedDocument: {
              ...state.storedDocument,
              count: Math.max(state.storedDocument.count - 1, 0),
              error: null,
              isLoading: false,
              items: state.storedDocument.items.filter((item) => item.id !== id),
              selectedItem:
                state.storedDocument.selectedItem?.id === id
                  ? null
                  : state.storedDocument.selectedItem,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to delete document.'));
          return false;
        }
      },

      async loadDocumentById(id: string, query?: StoredDocumentGetQuery): Promise<StoredDocument | null> {
        setLoading();
        try {
          const item = await service.getById(id, query);
          patchState(store, (state) => ({
            storedDocument: {
              ...state.storedDocument,
              error: null,
              isLoading: false,
              selectedItem: item,
            },
          }));
          return item;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load document.'));
          return null;
        }
      },

      async loadDocuments(query?: StoredDocumentListQuery): Promise<void> {
        setLoading();
        try {
          const [items, count] = await Promise.all([service.list(query), service.count(query)]);
          patchState(store, (state) => ({
            storedDocument: { ...state.storedDocument, count, error: null, isLoading: false, items },
          }));
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to load documents.'));
        }
      },

      async updateDocument(id: string, payload: StoredDocumentWritePayload): Promise<boolean> {
        setLoading();
        try {
          await service.update(id, { name: payload.name });
          const item = await service.getById(id);
          patchState(store, (state) => ({
            storedDocument: {
              ...state.storedDocument,
              error: null,
              isLoading: false,
              selectedItem: item,
              items: state.storedDocument.items.some((entry) => entry.id === id)
                ? state.storedDocument.items.map((entry) => (entry.id === id ? item : entry))
                : state.storedDocument.items,
            },
          }));
          return true;
        } catch (error) {
          setError(getApiErrorMessage(error, 'Failed to update document.'));
          return false;
        }
      },
    };
  }),
);
