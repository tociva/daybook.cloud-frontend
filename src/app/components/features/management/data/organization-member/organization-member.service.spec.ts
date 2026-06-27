import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type {
  InviteMemberPayload,
  OrganizationMemberPayload,
  OrganizationMemberUpdatePayload,
} from './organization-member.model';
import { CrudApiService } from '../../../../../shared/crud';
import { OrganizationMemberStatus, UserRoles } from './organization-member.enums';
import {
  createEmptyPermissionTree,
  mergePermissionTree,
} from './organization-member-permissions.util';
import { OrganizationMemberService } from './organization-member.service';

const ORGANIZATION_MEMBER_ENDPOINT = '/organization/organization-member';
const INVITE_MEMBER_ENDPOINT = '/organization/organization/invite-member';
const ACCEPT_INVITATION_ENDPOINT = '/organization/organization/accept-invitation';
const REJECT_INVITATION_ENDPOINT = '/organization/organization-member/reject-invitation';

describe('OrganizationMemberService contracts', () => {
  it('uses invite-member endpoint with email and permissions payload', () => {
    const payload: InviteMemberPayload = {
      email: 'invitee@example.com',
      permissions: { organizations: {} },
    };

    expect(INVITE_MEMBER_ENDPOINT).toBe('/organization/organization/invite-member');
    expect(payload).toEqual({
      email: 'invitee@example.com',
      permissions: { organizations: {} },
    });
    expect(payload).not.toHaveProperty('userid');
    expect(payload).not.toHaveProperty('organizationid');
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('status');
  });

  it('sends sparse permissions for create, invite, and patch requests', async () => {
    const create = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.INVITED,
      userid: 'user-1',
    }));
    const update = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.INVITED,
      userid: 'user-1',
    }));
    const permissions = mergePermissionTree(createEmptyPermissionTree('org-1', []), {
      organizations: {
        'org-1': {
          user: { inviteMember: true, removeMember: false },
          branch: { view: true, update: false },
        },
      },
    });
    const createPayload: OrganizationMemberPayload = {
      userid: 'user-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.INVITED,
      permissions,
    };
    const invitePayload: InviteMemberPayload = {
      email: 'invitee@example.com',
      permissions,
    };
    const updatePayload: OrganizationMemberUpdatePayload = {
      permissions,
    };
    const sparsePermissions = {
      organizations: {
        'org-1': {
          user: { inviteMember: true },
          branch: { view: true },
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        OrganizationMemberService,
        {
          provide: CrudApiService,
          useValue: { create, update },
        },
      ],
    });

    const service = TestBed.inject(OrganizationMemberService);
    await service.create(createPayload);
    await service.inviteMember(invitePayload);
    await service.update('member-1', updatePayload);

    expect(create).toHaveBeenNthCalledWith(1, ORGANIZATION_MEMBER_ENDPOINT, {
      userid: 'user-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.INVITED,
      permissions: sparsePermissions,
    });
    expect(create).toHaveBeenNthCalledWith(2, INVITE_MEMBER_ENDPOINT, {
      email: 'invitee@example.com',
      permissions: sparsePermissions,
    });
    expect(update).toHaveBeenCalledWith(ORGANIZATION_MEMBER_ENDPOINT, 'member-1', {
      permissions: sparsePermissions,
    });
  });

  it('uses dedicated invitation decision endpoints with organization id payload', async () => {
    const create = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: 'user',
      status: 1,
      userid: 'user-1',
    }));

    TestBed.configureTestingModule({
      providers: [
        OrganizationMemberService,
        {
          provide: CrudApiService,
          useValue: { create },
        },
      ],
    });

    const service = TestBed.inject(OrganizationMemberService);
    await service.acceptInvitation('org-1');
    await service.rejectInvitation('org-1');

    expect(create).toHaveBeenCalledWith(ACCEPT_INVITATION_ENDPOINT, {
      organizationid: 'org-1',
    });
    expect(create).toHaveBeenCalledWith(REJECT_INVITATION_ENDPOINT, {
      organizationid: 'org-1',
    });
  });
});
