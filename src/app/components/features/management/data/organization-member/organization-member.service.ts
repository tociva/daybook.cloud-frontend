import { Injectable, inject } from '@angular/core';
import { CrudApiService } from '../../../../../shared/crud';
import type {
  InviteMemberPayload,
  OrganizationMember,
  OrganizationMemberGetQuery,
  OrganizationMemberListQuery,
  OrganizationMemberPayload,
} from './organization-member.model';

const ENDPOINT = '/organization/organization-member';
const INVITE_ENDPOINT = '/organization/organization/invite-member';

@Injectable({ providedIn: 'root' })
export class OrganizationMemberService {
  private readonly crudApi = inject(CrudApiService);

  async create(payload: OrganizationMemberPayload): Promise<OrganizationMember> {
    return this.crudApi.create<OrganizationMember, OrganizationMemberPayload>(ENDPOINT, payload);
  }

  async inviteMember(payload: InviteMemberPayload): Promise<OrganizationMember> {
    return this.crudApi.create<OrganizationMember, InviteMemberPayload>(INVITE_ENDPOINT, payload);
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

  async update(id: string, payload: OrganizationMemberPayload): Promise<OrganizationMember> {
    return this.crudApi.update<OrganizationMember, OrganizationMemberPayload>(
      ENDPOINT,
      id,
      payload,
    );
  }
}
