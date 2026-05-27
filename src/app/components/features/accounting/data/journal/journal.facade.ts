import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Journal, JournalWritePayload } from './journal.model';
import { JournalStore } from './journal.store';

@Injectable({ providedIn: 'root' })
export class JournalFacade extends CrudFacadeBase<Journal, JournalWritePayload> {
  private readonly store = inject(JournalStore);

  protected readonly messages: CudMessages = {
    created: 'Journal created.',
    updated: 'Journal updated.',
    deleted: 'Journal deleted.',
  };

  protected doCreate(payload: JournalWritePayload): Promise<Journal | null> {
    return this.store.createJournal(payload);
  }

  protected doUpdate(id: string, payload: JournalWritePayload): Promise<boolean> {
    return this.store.updateJournal(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteJournal(id);
  }
}
