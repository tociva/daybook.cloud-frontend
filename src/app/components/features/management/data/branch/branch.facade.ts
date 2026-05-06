import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { Branch, BranchPayload } from './branch.model';
import { BranchStore } from './branch.store';

@Injectable({ providedIn: 'root' })
export class BranchFacade extends CrudFacadeBase<Branch, BranchPayload> {
  private readonly store = inject(BranchStore);

  protected readonly messages: CudMessages = {
    created: 'Branch created.',
    updated: 'Branch updated.',
    deleted: 'Branch deleted.',
  };

  protected doCreate(payload: BranchPayload): Promise<Branch | null> {
    return this.store.createBranch(payload);
  }

  protected doUpdate(id: string, payload: BranchPayload): Promise<boolean> {
    return this.store.updateBranch(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteBranch(id);
  }
}
