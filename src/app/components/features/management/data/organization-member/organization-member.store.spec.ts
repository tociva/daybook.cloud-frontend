import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationMemberStatus, UserRoles } from './organization-member.enums';
import { OrganizationMemberService } from './organization-member.service';
import { OrganizationMemberStore } from './organization-member.store';

describe('OrganizationMemberStore invitation actions', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('accepts an invitation by setting member status to accepted', async () => {
    const acceptInvitation = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.ACCEPTED,
      userid: 'user-1',
    }));

    TestBed.configureTestingModule({
      providers: [
        OrganizationMemberStore,
        { provide: OrganizationMemberService, useValue: { acceptInvitation } },
      ],
    });

    const store = TestBed.inject(OrganizationMemberStore);
    const result = await store.acceptInvitation('org-1');

    expect(result).toBe(true);
    expect(acceptInvitation).toHaveBeenCalledWith('org-1');
  });

  it('rejects an invitation by setting member status to rejected', async () => {
    const rejectInvitation = vi.fn(async () => ({
      id: 'member-1',
      organizationid: 'org-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.REJECTED,
      userid: 'user-1',
    }));

    TestBed.configureTestingModule({
      providers: [
        OrganizationMemberStore,
        { provide: OrganizationMemberService, useValue: { rejectInvitation } },
      ],
    });

    const store = TestBed.inject(OrganizationMemberStore);
    const result = await store.rejectInvitation('org-1');

    expect(result).toBe(true);
    expect(rejectInvitation).toHaveBeenCalledWith('org-1');
  });
});
