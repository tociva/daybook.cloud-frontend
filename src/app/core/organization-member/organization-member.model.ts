import type { Organization } from '../organization/organization.model';
import type { OrganizationMemberPermissions } from './organization-member.types';
import type { OrganizationMemberStatus, UserRoles } from './organization-member.enums';

export type OrganizationMember = Readonly<{
  id?: string;
  userid: string;
  organizationid: string;
  role: UserRoles;
  status: OrganizationMemberStatus;
  props?: Readonly<Record<string, unknown>>;
  permissions?: OrganizationMemberPermissions;
  organization?: Organization;
}>;

