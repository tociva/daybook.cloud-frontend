import type { StoredDocument } from './stored-document.model';

type StoredDocumentCollectionState = Readonly<{
  count: number;
  error: string | null;
  isLoading: boolean;
  items: readonly StoredDocument[];
  selectedItem: StoredDocument | null;
}>;

export type StoredDocumentState = Readonly<{
  storedDocument: StoredDocumentCollectionState;
}>;

export const initialStoredDocumentState: StoredDocumentState = {
  storedDocument: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
