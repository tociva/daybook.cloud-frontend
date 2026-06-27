import type { Organization } from '../organization/organization.model';
import type { OrganizationMemberPermissions } from './organization-member.types';
import type { OrganizationMemberStatus, UserRoles } from './organization-member.enums';
import type { Lb4ListQuery } from '../../../../../shared/crud';

export type User = Readonly<{
  id?: string;
  name: string;
  email: string;
  props?: Readonly<Record<string, unknown>>;
}>;

export type OrganizationMember = Readonly<{
  id?: string;
  userid: string;
  organizationid: string;
  role: UserRoles;
  status: OrganizationMemberStatus;
  props?: Readonly<Record<string, unknown>>;
  permissions?: OrganizationMemberPermissions;
  organization?: Organization;
  user?: User;
}>;

export type OrganizationMemberPayload = Readonly<{
  userid: string;
  organizationid?: string;
  role: UserRoles;
  status: OrganizationMemberStatus;
  props?: Readonly<Record<string, unknown>>;
  permissions?: OrganizationMemberPermissions;
}>;

export type InviteMemberPayload = Readonly<{
  email: string;
  permissions?: OrganizationMemberPermissions;
}>;

export type OrganizationMemberInvitationDecisionPayload = Readonly<{
  organizationid: string;
}>;

export type OrganizationMemberListQuery = Lb4ListQuery;

export type OrganizationMemberGetQuery = Readonly<{
  includes?: readonly string[];
}>;
