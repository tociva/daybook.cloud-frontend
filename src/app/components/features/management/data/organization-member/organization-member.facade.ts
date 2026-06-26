import { Injectable, inject } from '@angular/core';
import { CrudFacadeBase } from '../../../../../shared/crud';
import type { CudMessages } from '../../../../../shared/crud';
import { BurlNavigationService } from '../../../../../shared/burl-back-button/burl-navigation.service';
import { ToastStore } from '../../../../../core/toast/toast.store';
import type {
  InviteMemberPayload,
  OrganizationMember,
  OrganizationMemberPayload,
} from './organization-member.model';
import { OrganizationMemberStore } from './organization-member.store';

@Injectable({ providedIn: 'root' })
export class OrganizationMemberFacade extends CrudFacadeBase<
  OrganizationMember,
  OrganizationMemberPayload
> {
  private readonly store = inject(OrganizationMemberStore);
  private readonly memberToast = inject(ToastStore);
  private readonly memberNavigation = inject(BurlNavigationService);

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

  async inviteMember(
    payload: InviteMemberPayload,
    options: { navigateBack?: boolean } = {},
  ): Promise<OrganizationMember | null> {
    const navigateBack = options.navigateBack ?? true;
    const result = await this.store.inviteMember(payload);
    if (result) {
      this.memberToast.success(this.messages.created);
      if (navigateBack) await this.memberNavigation.navigateBack();
    }
    return result;
  }
}
