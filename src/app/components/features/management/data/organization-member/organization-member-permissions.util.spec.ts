import { describe, expect, it } from 'vitest';
import type { Branch } from '../branch/branch.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import {
  createEmptyPermissionTree,
  isGroupFullyChecked,
  isGroupPartiallyChecked,
  mergePermissionTree,
  serializePermissionTree,
  toggleGroup,
} from './organization-member-permissions.util';

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

describe('organization-member-permissions.util', () => {
  it('creates an empty permission tree for organization branches and fiscal years', () => {
    const tree = createEmptyPermissionTree('org-1', [branch]);
    const organization = tree.organizations['org-1'];

    expect(organization.user['inviteMember']).toBe(false);
    expect(organization.branch['create']).toBe(false);
    expect(organization.branches['branch-1'].item['bulkUpload']).toBe(false);
    expect(organization.branches['branch-1'].fiscalyears['fy-1'].journal['createDocument']).toBe(
      false,
    );
    expect(
      organization.branches['branch-1'].fiscalyears['fy-1'].accountingReports['trialBalance'],
    ).toBe(false);
  });

  it('merges existing permission values into the scaffold', () => {
    const base = createEmptyPermissionTree('org-1', [branch]);
    const merged = mergePermissionTree(base, {
      organizations: {
        'org-1': {
          user: { inviteMember: true, removeMember: false, updateMember: false },
          branch: {
            create: false,
            update: false,
            view: true,
            delete: false,
            uploadInvoiceTemplate: false,
            viewInvoiceTemplate: false,
            deleteInvoiceTemplate: false,
          },
          branches: {
            'branch-1': {
              item: {
                create: true,
                update: false,
                view: false,
                delete: false,
                bulkUpload: false,
              },
              fiscalyears: {
                'fy-1': {
                  accountingReports: {
                    trialBalance: true,
                    profitLoss: false,
                    balanceSheet: false,
                    ledgerReport: false,
                    ledgerCategoryReport: false,
                    accountantDashboard: false,
                  },
                },
              },
            },
          },
        },
      },
    });

    const organization = merged.organizations['org-1'];
    expect(organization.user['inviteMember']).toBe(true);
    expect(organization.branch['view']).toBe(true);
    expect(organization.branches['branch-1'].item['create']).toBe(true);
    expect(
      organization.branches['branch-1'].fiscalyears['fy-1'].accountingReports['trialBalance'],
    ).toBe(true);
    expect(organization.branches['branch-1'].fiscalyears['fy-1'].journal['create']).toBe(false);
  });

  it('treats missing, false, and non-boolean permission values as unchecked', () => {
    const base = createEmptyPermissionTree('org-1', [branch]);
    const merged = mergePermissionTree(base, {
      organizations: {
        'org-1': {
          user: {
            inviteMember: true,
            removeMember: false,
            updateMember: 'true',
          },
          branches: {
            'branch-1': {
              item: { create: true, update: false, view: 1 },
            },
          },
        },
      },
    });

    const organization = merged.organizations['org-1'];
    expect(organization.user['inviteMember']).toBe(true);
    expect(organization.user['removeMember']).toBe(false);
    expect(organization.user['updateMember']).toBe(false);
    expect(organization.branch['create']).toBe(false);
    expect(organization.branches['branch-1'].item['create']).toBe(true);
    expect(organization.branches['branch-1'].item['update']).toBe(false);
    expect(organization.branches['branch-1'].item['view']).toBe(false);
    expect(organization.branches['branch-1'].item['delete']).toBe(false);
  });

  it('serializes only true permission leaves and required ancestor objects', () => {
    const base = createEmptyPermissionTree('org-1', [branch]);
    const dense = mergePermissionTree(base, {
      organizations: {
        'org-1': {
          user: { inviteMember: true, removeMember: false },
          branch: { view: true, update: false },
          branches: {
            'branch-1': {
              item: { create: true, update: false },
              tax: { view: false },
              fiscalyears: {
                'fy-1': {
                  journal: { view: true, create: false },
                  ledger: { view: false },
                },
              },
            },
          },
        },
      },
    });

    const sparse = serializePermissionTree(dense);

    expect(sparse).toEqual({
      organizations: {
        'org-1': {
          user: { inviteMember: true },
          branch: { view: true },
          branches: {
            'branch-1': {
              item: { create: true },
              fiscalyears: {
                'fy-1': {
                  journal: { view: true },
                },
              },
            },
          },
        },
      },
    });

    const roundTrip = mergePermissionTree(base, sparse);
    expect(roundTrip.organizations['org-1'].user['inviteMember']).toBe(true);
    expect(roundTrip.organizations['org-1'].user['removeMember']).toBe(false);
    expect(roundTrip.organizations['org-1'].branches['branch-1'].item['create']).toBe(true);
    expect(roundTrip.organizations['org-1'].branches['branch-1'].item['update']).toBe(false);
    expect(
      roundTrip.organizations['org-1'].branches['branch-1'].fiscalyears['fy-1'].journal['view'],
    ).toBe(true);
    expect(
      roundTrip.organizations['org-1'].branches['branch-1'].fiscalyears['fy-1'].journal['create'],
    ).toBe(false);
  });

  it('serializes an all-false or invalid tree to an empty organizations object', () => {
    expect(serializePermissionTree(createEmptyPermissionTree('org-1', [branch]))).toEqual({
      organizations: {},
    });
    expect(
      serializePermissionTree({
        organizations: {
          'org-1': {
            user: { inviteMember: false, updateMember: 'true' },
            branches: [],
          },
        },
      }),
    ).toEqual({ organizations: {} });
  });

  it('supports group toggle helpers', () => {
    const flags = { create: false, update: false, view: false, delete: false };

    expect(isGroupFullyChecked(flags, ['create', 'update'])).toBe(false);
    expect(isGroupPartiallyChecked(flags, ['create', 'update'])).toBe(false);

    const toggled = toggleGroup(flags, ['create', 'update'], true);
    expect(isGroupFullyChecked(toggled, ['create', 'update'])).toBe(true);
    expect(isGroupPartiallyChecked(toggled, ['create', 'update', 'view'])).toBe(true);
  });
});
