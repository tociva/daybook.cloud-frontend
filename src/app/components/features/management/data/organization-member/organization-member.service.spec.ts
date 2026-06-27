import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { InviteMemberPayload } from './organization-member.model';
import { CrudApiService } from '../../../../../shared/crud';
import { OrganizationMemberService } from './organization-member.service';

const INVITE_MEMBER_ENDPOINT = '/organization/organization/invite-member';
const ACCEPT_INVITATION_ENDPOINT = '/organization/organization/accept-invitation';
const REJECT_INVITATION_ENDPOINT = '/organization/organization-member/reject-invitation';

describe('OrganizationMemberService invite contract', () => {
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
