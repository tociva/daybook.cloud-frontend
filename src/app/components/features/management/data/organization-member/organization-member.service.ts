import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  InviteMemberPayload,
  OrganizationMember,
  OrganizationMemberGetQuery,
  OrganizationMemberInvitationDecisionPayload,
  OrganizationMemberListQuery,
  OrganizationMemberPayload,
  OrganizationMemberUpdatePayload,
} from './organization-member.model';
import { serializePermissionTree } from './organization-member-permissions.util';

const ENDPOINT = '/organization/organization-member';
const INVITE_ENDPOINT = '/organization/organization/invite-member';
const ACCEPT_INVITATION_ENDPOINT = '/organization/organization/accept-invitation';
const REJECT_INVITATION_ENDPOINT = '/organization/organization-member/reject-invitation';

@Injectable({ providedIn: 'root' })
export class OrganizationMemberService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: OrganizationMemberPayload): Promise<OrganizationMember> {
    const request =
      payload.permissions === undefined
        ? payload
        : { ...payload, permissions: serializePermissionTree(payload.permissions) };
    return this.crudApi.create<OrganizationMember, typeof request>(ENDPOINT, request);
  }

  async inviteMember(payload: InviteMemberPayload): Promise<OrganizationMember> {
    const request =
      payload.permissions === undefined
        ? payload
        : { ...payload, permissions: serializePermissionTree(payload.permissions) };
    return this.crudApi.create<OrganizationMember, typeof request>(INVITE_ENDPOINT, request);
  }

  async delete(id: string): Promise<void> {
    return this.crudApi.delete(ENDPOINT, id);
  }

  async getById(id: string, query?: OrganizationMemberGetQuery): Promise<OrganizationMember> {
    return this.crudApi.getById<OrganizationMember>(ENDPOINT, id, query);
  }

  async list(query: OrganizationMemberListQuery = {}): Promise<readonly OrganizationMember[]> {
    return this.crudApi.list<OrganizationMember>(ENDPOINT, query);
  }

  async count(query: OrganizationMemberListQuery = {}): Promise<number> {
    return this.crudApi.count(ENDPOINT, query);
  }

  async update(id: string, payload: OrganizationMemberUpdatePayload): Promise<OrganizationMember> {
    const request = { ...payload, permissions: serializePermissionTree(payload.permissions) };
    return this.crudApi.update<OrganizationMember, typeof request>(ENDPOINT, id, request);
  }

  async acceptInvitation(organizationid: string): Promise<OrganizationMember> {
    return this.crudApi.create<OrganizationMember, OrganizationMemberInvitationDecisionPayload>(
      ACCEPT_INVITATION_ENDPOINT,
      { organizationid },
    );
  }

  async rejectInvitation(organizationid: string): Promise<OrganizationMember> {
    return this.crudApi.create<OrganizationMember, OrganizationMemberInvitationDecisionPayload>(
      REJECT_INVITATION_ENDPOINT,
      { organizationid },
    );
  }

  async resendInvitation(id: string): Promise<OrganizationMember> {
    return this.crudApi.postSubresource<OrganizationMember>(ENDPOINT, id, 'resend-invitation');
  }
}
