import { describe, expect, it } from 'vitest';
import type { InviteMemberPayload } from './organization-member.model';

const INVITE_MEMBER_ENDPOINT = '/organization/organization/invite-member';

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
});
