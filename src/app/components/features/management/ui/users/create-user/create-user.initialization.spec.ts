import { describe, expect, it, vi } from 'vitest';
import type { OrganizationMember } from '../../../data/organization-member/organization-member.model';
import {
  OrganizationMemberStatus,
  UserRoles,
} from '../../../data/organization-member/organization-member.enums';
import type { Organization } from '../../../data/organization/organization.model';
import type { Branch } from '../../../data/branch/branch.model';
import type { FiscalYear } from '../../../data/fiscal-year/fiscal-year.model';
import type { UserSession } from '../../../data/user-session/user-session.model';
import { createEmptyPermissionTree, mergePermissionTree } from '../../../data/organization-member/organization-member-permissions.util';
import {
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
  organizationid: 'org-1',
  userid: 'owner',
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

async function bootstrapEditPermissions(
  session: UserSession,
  member: OrganizationMember,
  loadOrganizationById: (organizationId: string) => Promise<Organization | null>,
) {
  const resolvedOrganization = await resolveOrganizationFromSession(session, loadOrganizationById);
  if (!resolvedOrganization?.id) {
    return null;
  }

  const memberOrganization = await resolveOrganizationWithBranches(
    member.organizationid ?? resolvedOrganization.id,
    member.organization ?? resolvedOrganization,
    loadOrganizationById,
  );
  if (!memberOrganization?.id) {
    return null;
  }

  return mergePermissionTree(
    createEmptyPermissionTree(memberOrganization.id, memberOrganization.branches ?? []),
    member.permissions,
  );
}

describe('create-user initialization flows', () => {
  it('preserves branch permissions when member organization include is shallow', async () => {
    const member: OrganizationMember = {
      id: 'member-1',
      organization: {
        id: 'org-1',
        name: 'Acme',
        email: 'acme@example.com',
        userid: 'owner',
        branches: [],
      },
      organizationid: 'org-1',
      permissions: {
        organizations: {
          'org-1': {
            user: { inviteMember: false, removeMember: false, updateMember: false },
            branch: {
              create: false,
              update: false,
              view: false,
              delete: false,
              uploadInvoiceTemplate: false,
              viewInvoiceTemplate: false,
              deleteInvoiceTemplate: false,
            },
            branches: {
              'branch-1': {
                fiscalYear: { create: true, update: false, view: false, delete: false },
                item: { create: false, update: false, view: false, delete: false, bulkUpload: false },
                itemCategory: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                tax: { create: false, update: false, view: false, delete: false, bulkUpload: false },
                taxGroup: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                customer: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                vendor: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                purchaseInvoice: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                  createDocument: false,
                  deleteDocument: false,
                },
                saleInvoice: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                  createDocument: false,
                  deleteDocument: false,
                },
                purchaseReturn: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                  createDocument: false,
                  deleteDocument: false,
                },
                customerReceipt: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                vendorPayment: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                bankCash: {
                  create: false,
                  update: false,
                  view: false,
                  delete: false,
                  bulkUpload: false,
                },
                contraTransaction: { create: false, update: false, view: false, delete: false },
                inventoryReports: { bankCashReport: false },
                fiscalyears: {},
              },
            },
          },
        },
      },
      role: UserRoles.USER,
      status: OrganizationMemberStatus.INVITED,
      userid: 'member@example.com',
    };

    const loadOrganizationById = vi.fn().mockResolvedValue(organization);
    const session: UserSession = {
      email: 'owner@example.com',
      member: null,
      memberorgs: [],
      name: 'Owner',
      organization,
      userid: 'owner',
    };

    const permissions = await bootstrapEditPermissions(session, member, loadOrganizationById);

    expect(loadOrganizationById).toHaveBeenCalledWith('org-1');
    expect(
      permissions?.organizations['org-1']?.branches['branch-1']?.fiscalYear.create,
    ).toBe(true);
  });
});
