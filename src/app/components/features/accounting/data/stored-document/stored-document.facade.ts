import { Injectable, inject } from '@angular/core';
import type { CudMessages } from '../../../../../shared/crud';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { StoredDocument, StoredDocumentWritePayload } from './stored-document.model';
import { StoredDocumentStore } from './stored-document.store';

@Injectable({ providedIn: 'root' })
export class StoredDocumentFacade extends CrudFacadeBase<StoredDocument, StoredDocumentWritePayload> {
  private readonly store = inject(StoredDocumentStore);

  protected readonly messages: CudMessages = {
    created: 'Document created.',
    updated: 'Document updated.',
    deleted: 'Document deleted.',
  };

  protected doCreate(payload: StoredDocumentWritePayload): Promise<StoredDocument | null> {
    return this.store.createDocument(payload);
  }

  protected doUpdate(id: string, payload: StoredDocumentWritePayload): Promise<boolean> {
    return this.store.updateDocument(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteDocument(id);
  }
}
