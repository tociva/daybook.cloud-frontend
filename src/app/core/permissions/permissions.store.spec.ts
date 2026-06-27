import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../components/features/management/data/organization-member/organization-member.enums';
import type { UserSession } from '../../components/features/management/data/user-session/user-session.model';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { PERMISSION } from './permission-requirements';
import { allPermissions, anyPermission } from './permissions.model';
import { PermissionsStore } from './permissions.store';

function memberSession(overrides: Record<string, unknown> = {}): UserSession {
  return {
    email: 'member@example.test',
    name: 'Member',
    userid: 'user-1',
    memberorgs: [],
    organization: { id: 'org-1', name: 'Org' },
    branch: { id: 'branch-1', name: 'Branch' },
    fiscalyear: { id: 'fy-1', name: 'FY' },
    member: {
      organizationid: 'org-1',
      userid: 'user-1',
      role: UserRoles.USER,
      status: OrganizationMemberStatus.ACCEPTED,
      permissions: {
        organization: { view: true },
        userSubscription: { viewSubscription: true },
        organizations: {
          'org-1': {
            user: { viewMember: true },
            branch: { view: true },
            branches: {
              'branch-1': {
                bankCash: { view: true },
                customer: { view: true, create: false, update: 'true' },
                fiscalYear: { view: true },
                fiscalyears: {
                  'fy-1': {
                    journal: { view: true },
                    accountingReports: { accountantDashboard: false, trialBalance: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    ...overrides,
  } as unknown as UserSession;
}

describe('PermissionsStore', () => {
  const session = signal<UserSession | null>(memberSession());
  let store: PermissionsStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    session.set(memberSession());
    TestBed.configureTestingModule({
      providers: [
        PermissionsStore,
        { provide: UserSessionStore, useValue: { session } },
      ],
    });
    store = TestBed.inject(PermissionsStore);
  });

  it('resolves exact true values at all four permission levels', () => {
    expect(store.can(PERMISSION.root.organization.view)).toBe(true);
    expect(store.can(PERMISSION.organization.user.view)).toBe(true);
    expect(store.can(PERMISSION.branch.customer.view)).toBe(true);
    expect(store.can(PERMISSION.fiscalYear.journal.view)).toBe(true);
  });

  it('denies false, absent, malformed, and unknown values', () => {
    expect(store.can(PERMISSION.branch.customer.create)).toBe(false);
    expect(store.can(PERMISSION.branch.customer.delete)).toBe(false);
    expect(store.can(PERMISSION.branch.customer.update)).toBe(false);
    expect(store.can({ level: 'branch', resource: 'unknown', action: 'view' })).toBe(false);
  });

  it('supports allOf and anyOf matches', () => {
    expect(
      store.can(allPermissions(PERMISSION.branch.customer.view, PERMISSION.fiscalYear.journal.view)),
    ).toBe(true);
    expect(
      store.can(anyPermission(PERMISSION.branch.customer.create, PERMISSION.fiscalYear.journal.view)),
    ).toBe(true);
    expect(store.can(allPermissions())).toBe(false);
  });

  it('gives accepted owners the backend-equivalent bypass', () => {
    session.set(memberSession({
      organization: null,
      branch: null,
      fiscalyear: null,
      member: {
        organizationid: 'org-1',
        userid: 'owner-1',
        role: UserRoles.OWNER,
        status: OrganizationMemberStatus.ACCEPTED,
      },
    }));

    expect(store.isOwner()).toBe(true);
    expect(store.can(PERMISSION.ownerOnly)).toBe(true);
    expect(store.can(PERMISSION.fiscalYear.journal.delete)).toBe(true);
  });

  it('does not give admins an implicit bypass', () => {
    session.set(memberSession({
      member: {
        organizationid: 'org-1',
        userid: 'admin-1',
        role: UserRoles.ADMIN,
        status: OrganizationMemberStatus.ACCEPTED,
        permissions: { organizations: {} },
      },
    }));

    expect(store.can(PERMISSION.branch.customer.view)).toBe(false);
    expect(store.can(PERMISSION.ownerOnly)).toBe(false);
  });

  it('requires accepted membership and an active id for scoped permissions', () => {
    session.set(memberSession({ branch: null }));
    expect(store.can(PERMISSION.branch.customer.view)).toBe(false);

    session.set(memberSession({ fiscalyear: null }));
    expect(store.can(PERMISSION.fiscalYear.journal.view)).toBe(false);

    const rejected = memberSession();
    session.set({
      ...rejected,
      member: rejected.member
        ? { ...rejected.member, status: OrganizationMemberStatus.REJECTED }
        : null,
    });
    expect(store.can(PERMISSION.root.organization.view)).toBe(false);
  });

  it('reacts to logout and organization, branch, and fiscal-year switching', () => {
    expect(store.can(PERMISSION.fiscalYear.journal.view)).toBe(true);

    session.set(memberSession({ organization: { id: 'org-2', name: 'Other' } }));
    expect(store.can(PERMISSION.organization.user.view)).toBe(false);

    session.set(memberSession({ branch: { id: 'branch-2', name: 'Other' } }));
    expect(store.can(PERMISSION.branch.customer.view)).toBe(false);

    session.set(memberSession({ fiscalyear: { id: 'fy-2', name: 'Other' } }));
    expect(store.can(PERMISSION.fiscalYear.journal.view)).toBe(false);

    session.set(null);
    expect(store.can(PERMISSION.root.organization.view)).toBe(false);
  });

  it('selects dashboard, then the first menu destination, then Profile', () => {
    expect(store.firstAllowedWorkspaceRoute()).toBe('/app/trading/bank-cash');

    const current = memberSession();
    session.set({
      ...current,
      member: current.member
        ? {
            ...current.member,
            permissions: {
              organizations: {
                'org-1': {
                  branches: {
                    'branch-1': {
                      fiscalyears: {
                        'fy-1': {
                          accountingReports: { accountantDashboard: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          }
        : null,
    } as UserSession);
    expect(store.firstAllowedWorkspaceRoute()).toBe('/app/dashboard');

    session.set(memberSession({
      member: {
        organizationid: 'org-1',
        userid: 'user-1',
        role: UserRoles.USER,
        status: OrganizationMemberStatus.ACCEPTED,
        permissions: { organizations: {} },
      },
    }));
    expect(store.firstAllowedWorkspaceRoute()).toBe('/app/profile');
  });
});
