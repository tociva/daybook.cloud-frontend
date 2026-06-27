import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TngInputComponent } from '@tailng-ui/components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Branch } from '../../../data/branch/branch.model';
import { BranchStore } from '../../../data/branch/branch.store';
import type { Organization } from '../../../data/organization/organization.model';
import { OrganizationStore } from '../../../data/organization/organization.store';
import {
  OrganizationMemberFacade,
  OrganizationMemberStatus,
  OrganizationMemberStore,
  UserRoles,
} from '../../../data/organization-member';
import type {
  OrganizationMember,
  OrganizationMemberPermissionTree,
  OrganizationMemberUpdatePayload,
} from '../../../data/organization-member';
import { UserSessionStore } from '../../../data/user-session/user-session.store';
import { CreateUserComponent, type PageLoadState } from './create-user.component';

type CreateUserHarness = Readonly<{
  email(): string;
  isSaveDisabled(): boolean;
  loadState(): PageLoadState;
  permissions(): OrganizationMemberPermissionTree;
  save(event: Event): Promise<void>;
}>;

const branch: Branch & { id: string } = {
  id: 'branch-1',
  name: 'Main Branch',
  email: 'branch@example.com',
  fiscalstart: '04-01',
  dateformat: 'DD/MM/YYYY',
  timezone: 'Asia/Kolkata',
  invnumber: 'INV-',
  recnumber: 'REC-',
  paynumber: 'PAY-',
  organizationid: 'org-1',
  currencycode: 'INR',
  countrycode: 'IN',
  userid: 'owner-1',
  organization: {
    id: 'org-1',
    name: 'Acme',
    email: 'acme@example.com',
    userid: 'owner-1',
    branches: [],
  },
  fiscalyears: [
    {
      id: 'fy-1',
      name: 'FY 2026',
      startdate: '2026-04-01',
      enddate: '2027-03-31',
      branchid: 'branch-1',
      currencycode: 'INR',
    },
  ],
};

const organization: Organization & { id: string } = {
  id: 'org-1',
  name: 'Acme',
  email: 'acme@example.com',
  userid: 'owner-1',
  branches: [],
};

const storedPermissions = {
  organizations: {
    'org-1': {
      user: { inviteMember: true, updateMember: false },
      branches: {
        'branch-1': {
          item: { create: true, update: false },
          fiscalyears: {
            'fy-1': {
              journal: { view: true },
            },
          },
        },
      },
    },
  },
} as unknown as OrganizationMemberPermissionTree;

const member: OrganizationMember = {
  id: 'member-1',
  userid: 'user-123',
  organizationid: 'org-1',
  role: UserRoles.USER,
  status: OrganizationMemberStatus.ACCEPTED,
  props: { source: 'existing' },
  permissions: storedPermissions,
  organization,
  user: {
    id: 'user-123',
    name: 'Existing User',
    email: 'user@example.com',
  },
};

function asHarness(component: CreateUserComponent): CreateUserHarness {
  return component as unknown as CreateUserHarness;
}

async function flushInitialization(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function setup(
  options: Readonly<{ branchError?: string | null; selectedMember?: OrganizationMember }> = {},
) {
  const selectedMember = options.selectedMember ?? member;
  const loadMemberById = vi.fn(async () => selectedMember);
  const loadBranches = vi.fn(async () => undefined);
  const update = vi.fn(async (_id: string, _payload: OrganizationMemberUpdatePayload) => true);

  TestBed.configureTestingModule({
    imports: [CreateUserComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            paramMap: convertToParamMap({ id: 'member-1' }),
          },
        },
      },
      {
        provide: OrganizationMemberFacade,
        useValue: { inviteMember: vi.fn(), update },
      },
      {
        provide: OrganizationMemberStore,
        useValue: {
          clearError: vi.fn(),
          error: signal<string | null>(null),
          loadMemberById,
        },
      },
      {
        provide: BranchStore,
        useValue: {
          branches: signal<readonly Branch[]>([branch]),
          error: signal<string | null>(options.branchError ?? null),
          isLoading: signal(false),
          loadBranches,
        },
      },
      {
        provide: OrganizationStore,
        useValue: {
          loadOrganizationById: vi.fn(async () => organization),
        },
      },
      {
        provide: UserSessionStore,
        useValue: { session: signal(null) },
      },
    ],
  });

  return { loadBranches, loadMemberById, update };
}

describe('CreateUserComponent edit mode', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('loads the related email and complete organization permission context', async () => {
    const { loadBranches, loadMemberById } = setup();
    const component = TestBed.runInInjectionContext(() => new CreateUserComponent());
    const harness = asHarness(component);

    await flushInitialization();

    expect(loadMemberById).toHaveBeenCalledWith('member-1', {
      includes: ['organization', 'user'],
    });
    expect(loadBranches).toHaveBeenCalledWith({
      where: { organizationid: 'org-1' },
      includes: ['fiscalyears'],
    });
    expect(harness.loadState()).toBe('ready');
    expect(harness.email()).toBe('user@example.com');

    const organizationPermissions = harness.permissions().organizations['org-1'];
    expect(organizationPermissions.user['inviteMember']).toBe(true);
    expect(organizationPermissions.user['removeMember']).toBe(false);
    expect(organizationPermissions.branches['branch-1'].item['create']).toBe(true);
    expect(organizationPermissions.branches['branch-1'].item['delete']).toBe(false);
    expect(organizationPermissions.branches['branch-1'].fiscalyears['fy-1'].journal['view']).toBe(
      true,
    );
    expect(organizationPermissions.branches['branch-1'].fiscalyears['fy-1'].journal['create']).toBe(
      false,
    );
  });

  it('renders the related email in a readonly input', async () => {
    setup();
    const fixture = TestBed.createComponent(CreateUserComponent);

    fixture.detectChanges();
    await flushInitialization();
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.directive(TngInputComponent));
    const inputComponent = input.componentInstance as TngInputComponent;
    expect(inputComponent.value()).toBe('user@example.com');
    expect(inputComponent.readonly()).toBe(true);
  });

  it('sends only permissions when saving changes', async () => {
    const { update } = setup();
    const component = TestBed.runInInjectionContext(() => new CreateUserComponent());
    const harness = asHarness(component);

    await flushInitialization();
    await harness.save({ preventDefault: vi.fn() } as unknown as Event);

    expect(update).toHaveBeenCalledTimes(1);
    const [id, payload] = update.mock.calls[0] as [string, OrganizationMemberUpdatePayload];
    expect(id).toBe('member-1');
    expect(payload).toEqual({ permissions: harness.permissions() });
    expect(payload).not.toHaveProperty('userid');
    expect(payload).not.toHaveProperty('organizationid');
    expect(payload).not.toHaveProperty('role');
    expect(payload).not.toHaveProperty('status');
    expect(payload).not.toHaveProperty('props');
  });

  it('blocks editing when the related email is unavailable', async () => {
    const { update } = setup({ selectedMember: { ...member, user: undefined } });
    const component = TestBed.runInInjectionContext(() => new CreateUserComponent());
    const harness = asHarness(component);

    await flushInitialization();
    await harness.save({ preventDefault: vi.fn() } as unknown as Event);

    expect(harness.loadState()).toBe('load-error');
    expect(harness.isSaveDisabled()).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });

  it('blocks editing when branches and fiscal years cannot be loaded', async () => {
    const { update } = setup({ branchError: 'Failed to load branches.' });
    const component = TestBed.runInInjectionContext(() => new CreateUserComponent());
    const harness = asHarness(component);

    await flushInitialization();
    await harness.save({ preventDefault: vi.fn() } as unknown as Event);

    expect(harness.loadState()).toBe('load-error');
    expect(harness.isSaveDisabled()).toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
});
