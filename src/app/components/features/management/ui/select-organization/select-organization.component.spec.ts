import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../core/date/date-management.service';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../data/organization-member/organization-member.enums';
import type { Organization } from '../../data/organization/organization.model';
import type { UserSession } from '../../data/user-session/user-session.model';
import { UserSessionStore } from '../../data/user-session/user-session.store';
import { SelectOrganizationComponent } from './select-organization.component';

type SelectOrganizationComponentHarness = SelectOrganizationComponent & {
  organizations: () => readonly Organization[];
};

describe('SelectOrganizationComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  function createComponent(session: UserSession): SelectOrganizationComponentHarness {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: DateManagementService,
          useValue: { formatDisplayDate: vi.fn((value: string) => value) },
        },
        {
          provide: UserSessionStore,
          useValue: {
            isLoading: vi.fn(() => false),
            selectBranch: vi.fn(),
            selectFiscalYear: vi.fn(),
            selectOrganization: vi.fn(),
            session: vi.fn(() => session),
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(
      () => new SelectOrganizationComponent(),
    ) as SelectOrganizationComponentHarness;
  }

  it('lists own and accepted member organizations while excluding pending invitations', () => {
    const ownOrganization = {
      branches: [],
      email: 'own@example.test',
      id: 'org-own',
      name: 'Own Organization',
      userid: 'user-1',
    } as Organization;
    const acceptedOrganization = {
      branches: [],
      email: 'accepted@example.test',
      id: 'org-accepted',
      name: 'Accepted Organization',
      userid: 'owner-2',
    } as Organization;
    const pendingOrganization = {
      branches: [],
      email: 'pending@example.test',
      id: 'org-pending',
      name: 'Pending Organization',
      userid: 'owner-3',
    } as Organization;
    const session = {
      email: 'user@example.test',
      member: null,
      memberorgs: [
        {
          organization: acceptedOrganization,
          organizationid: acceptedOrganization.id,
          role: UserRoles.USER,
          status: OrganizationMemberStatus.ACCEPTED,
          userid: 'user-1',
        },
        {
          organization: pendingOrganization,
          organizationid: pendingOrganization.id,
          role: UserRoles.USER,
          status: OrganizationMemberStatus.INVITED,
          userid: 'user-1',
        },
      ],
      name: 'Test User',
      organization: null,
      ownorgs: [ownOrganization],
      userid: 'user-1',
    } as UserSession;

    const component = createComponent(session);
    const organizations = component.organizations();

    expect(organizations.map((organization) => organization.name)).toEqual([
      'Own Organization',
      'Accepted Organization',
    ]);
  });
});
