import { describe, expect, it, vi } from 'vitest';
import type { Organization } from '../../../data/organization/organization.model';
import type { Branch } from '../../../data/branch/branch.model';
import type { FiscalYear } from '../../../data/fiscal-year/fiscal-year.model';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../../data/organization-member/organization-member.enums';
import type { UserSession } from '../../../data/user-session/user-session.model';
import {
  getAvailableOrganizations,
  resolveOrganizationFromSession,
  resolveOrganizationWithBranches,
} from './create-user-organization.util';

const fiscalYear: FiscalYear & { id: string } = {
  id: 'fy-1',
  name: 'FY 2025',
  startdate: '2025-04-01',
  enddate: '2026-03-31',
  currencycode: 'INR',
  branchid: 'branch-1',
};

const branch: Branch & { id: string } = {
  id: 'branch-1',
  name: 'Main Branch',
  email: 'main@example.com',
  fiscalstart: '04-01',
  dateformat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  invnumber: 'INV-',
  recnumber: 'REC-',
  paynumber: 'PAY-',
  organizationid: 'org-1',
  currencycode: 'INR',
  countrycode: 'IN',
  userid: 'owner',
  organization: {
    id: 'org-1',
    name: 'Acme',
    email: 'acme@example.com',
    userid: 'owner',
    branches: [],
  },
  fiscalyears: [fiscalYear],
};

const organization: Organization & { id: string } = {
  id: 'org-1',
  name: 'Acme',
  email: 'acme@example.com',
  userid: 'owner',
  branches: [branch],
};

describe('create-user-organization.util', () => {
  it('merges own and accepted member organizations', () => {
    const session: UserSession = {
      email: 'owner@example.com',
      member: null,
      memberorgs: [
        {
          organization: {
            id: 'org-member',
            name: 'Member Org',
            email: 'member@example.com',
            userid: 'owner-2',
            branches: [],
          },
          organizationid: 'org-member',
          role: UserRoles.USER,
          status: OrganizationMemberStatus.ACCEPTED,
          userid: 'member@example.com',
        },
        {
          organization: {
            id: 'org-pending',
            name: 'Pending Org',
            email: 'pending@example.com',
            userid: 'owner-3',
            branches: [],
          },
          organizationid: 'org-pending',
          role: UserRoles.USER,
          status: OrganizationMemberStatus.INVITED,
          userid: 'pending@example.com',
        },
      ],
      name: 'Owner',
      ownorgs: [organization],
      userid: 'owner',
    };

    expect(getAvailableOrganizations(session).map((org) => org.id)).toEqual([
      'org-1',
      'org-member',
    ]);
  });

  it('falls back to ownorgs when session organization is missing', async () => {
    const session: UserSession = {
      email: 'owner@example.com',
      member: null,
      memberorgs: [],
      name: 'Owner',
      organization: null,
      ownorgs: [organization],
      userid: 'owner',
    };

    const resolved = await resolveOrganizationFromSession(session, vi.fn());
    expect(resolved?.id).toBe('org-1');
    expect(resolved?.branches).toEqual([branch]);
  });

  it('loads organization by id when session organization has no branches', async () => {
    const session: UserSession = {
      email: 'owner@example.com',
      member: null,
      memberorgs: [],
      name: 'Owner',
      organization: {
        id: 'org-1',
        name: 'Acme',
        email: 'acme@example.com',
        userid: 'owner',
        branches: [],
      },
      userid: 'owner',
    };
    const loadOrganizationById = vi.fn().mockResolvedValue(organization);

    const resolved = await resolveOrganizationFromSession(session, loadOrganizationById);

    expect(loadOrganizationById).toHaveBeenCalledWith('org-1');
    expect(resolved?.branches).toEqual([branch]);
  });

  it('prefers loaded organization with branches over shallow include', async () => {
    const shallowOrganization: Organization = {
      id: 'org-1',
      name: 'Acme',
      email: 'acme@example.com',
      userid: 'owner',
      branches: [],
    };
    const loadOrganizationById = vi.fn().mockResolvedValue(organization);

    const resolved = await resolveOrganizationWithBranches(
      'org-1',
      shallowOrganization,
      loadOrganizationById,
    );

    expect(loadOrganizationById).toHaveBeenCalledWith('org-1');
    expect(resolved?.branches).toEqual([branch]);
  });
});
