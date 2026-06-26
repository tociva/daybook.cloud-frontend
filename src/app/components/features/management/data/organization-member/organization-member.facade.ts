import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import type { OrganizationMember, OrganizationMemberPayload } from './organization-member.model';
import { OrganizationMemberStore } from './organization-member.store';

@Injectable({ providedIn: 'root' })
export class OrganizationMemberFacade extends CrudFacadeBase<
  OrganizationMember,
  OrganizationMemberPayload
> {
  private readonly store = inject(OrganizationMemberStore);

  protected readonly messages: CudMessages = {
    created: 'User invited.',
    updated: 'User updated.',
    deleted: 'User removed.',
  };

  protected doCreate(payload: OrganizationMemberPayload): Promise<OrganizationMember | null> {
    return this.store.createMember(payload);
  }

  protected doUpdate(id: string, payload: OrganizationMemberPayload): Promise<boolean> {
    return this.store.updateMember(id, payload);
  }

  protected doDelete(id: string): Promise<boolean> {
    return this.store.deleteMember(id);
  }
}
