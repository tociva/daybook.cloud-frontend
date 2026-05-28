import { Injectable, inject } from '@angular/core';
import { ToastStore } from '../../../../../core/toast/toast.store';
import { BurlNavigationService } from '../../../../../shared/burl-back-button/burl-navigation.service';
import type { CudMessages, CudOptions } from '../../../../../shared/crud';
import type {
  StoredDocument,
  StoredDocumentCreatePayload,
  StoredDocumentUpdatePayload,
} from './stored-document.model';
import { StoredDocumentStore } from './stored-document.store';

const DEFAULT_OPTIONS: Required<CudOptions> = { navigateBack: true };

@Injectable({ providedIn: 'root' })
export class StoredDocumentFacade {
  private readonly store = inject(StoredDocumentStore);
  private readonly toast = inject(ToastStore);
  private readonly navigation = inject(BurlNavigationService);

  private readonly messages: CudMessages = {
    created: 'Document created.',
    updated: 'Document updated.',
    deleted: 'Document deleted.',
  };

  async create(
    payload: StoredDocumentCreatePayload,
    options: CudOptions = {},
  ): Promise<StoredDocument | null> {
    const { navigateBack } = { ...DEFAULT_OPTIONS, ...options };
    const result = await this.store.createDocument(payload);

    if (result) {
      this.toast.success(this.messages.created);
      if (navigateBack) {
        await this.navigation.navigateBack();
      }
    }

    return result;
  }

  async update(id: string, payload: StoredDocumentUpdatePayload, options: CudOptions = {}): Promise<boolean> {
    const { navigateBack } = { ...DEFAULT_OPTIONS, ...options };
    const result = await this.store.updateDocument(id, payload);

    if (result) {
      this.toast.success(this.messages.updated);
      if (navigateBack) {
        await this.navigation.navigateBack();
      }
    }

    return result;
  }

  async delete(id: string, options: CudOptions = {}): Promise<boolean> {
    const { navigateBack } = { ...DEFAULT_OPTIONS, ...options };
    const result = await this.store.deleteDocument(id);

    if (result) {
      this.toast.success(this.messages.deleted);
      if (navigateBack) {
        await this.navigation.navigateBack();
      }
    }

    return result;
  }
}
