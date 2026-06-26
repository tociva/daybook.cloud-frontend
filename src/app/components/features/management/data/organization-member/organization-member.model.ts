import type { Organization } from '../organization/organization.model';
import type { OrganizationMemberPermissions } from './organization-member.types';
import type { OrganizationMemberStatus, UserRoles } from './organization-member.enums';
import type { Lb4ListQuery } from '../../../../../shared/crud';

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

export type OrganizationMemberPayload = Readonly<{
  userid: string;
  organizationid: string;
  role: UserRoles;
  status: OrganizationMemberStatus;
  props?: Readonly<Record<string, unknown>>;
  permissions?: OrganizationMemberPermissions;
}>;

export type OrganizationMemberListQuery = Lb4ListQuery;

export type OrganizationMemberGetQuery = Readonly<{
  includes?: readonly string[];
}>;
