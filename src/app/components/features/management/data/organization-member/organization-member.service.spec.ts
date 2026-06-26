import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import type { InviteMemberPayload } from './organization-member.model';
import { CrudApiService } from '../../../../../shared/crud';
import { OrganizationMemberStatus } from './organization-member.enums';
import { OrganizationMemberService } from './organization-member.service';

const INVITE_MEMBER_ENDPOINT = '/organization/organization/invite-member';
const ORGANIZATION_MEMBER_ENDPOINT = '/organization/organization-member';

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

  it('patches only status for invitation decisions', async () => {
    const update = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: 'user',
      status: OrganizationMemberStatus.ACCEPTED,
      userid: 'user-1',
    }));

    TestBed.configureTestingModule({
      providers: [
        OrganizationMemberService,
        {
          provide: CrudApiService,
          useValue: { update },
        },
      ],
    });

    const service = TestBed.inject(OrganizationMemberService);
    await service.updateStatus('member-1', { status: OrganizationMemberStatus.ACCEPTED });

    expect(update).toHaveBeenCalledWith(ORGANIZATION_MEMBER_ENDPOINT, 'member-1', {
      status: OrganizationMemberStatus.ACCEPTED,
    });
  });
});
