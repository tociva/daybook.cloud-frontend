import type { Branch } from '../branch/branch.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import type { OrganizationMemberPermissions } from '../organization-member/organization-member.types';
import type {
  OrganizationMemberStatus,
  UserRoles,
} from '../organization-member/organization-member.enums';
import type { OrganizationMember } from '../organization-member/organization-member.model';
import type { Organization } from '../organization/organization.model';
import type { Subscription } from '../subscription/subscription.model';

export type UserProps = {
  ledgerCache?: boolean;
  mode?: string;
  theme?: string;
} & Record<string, unknown>;

export type UserSessionInvitedOrganizationDetails = Readonly<{
  id?: string;
  name: string;
  email?: string;
  mobile?: string;
  address?: unknown;
  description?: string;
  smalllogodocumentid?: string | null;
  normallogodocumentid?: string | null;
}>;

export type UserSessionInvitedOrganization = Readonly<{
  id?: string;
  userid?: string;
  organizationid: string;
  role: UserRoles;
  status: OrganizationMemberStatus;
  props?: Readonly<Record<string, unknown>>;
  permissions?: OrganizationMemberPermissions;
  organization?: UserSessionInvitedOrganizationDetails;
}>;

export interface UserSession {
  id?: string;
  displayname?: string;
  displayName?: string;
  username?: string;
  name: string;
  email: string;
  userid: string;
  updatedat?: string;
  subscription?: Subscription | null;
  organization?: Organization | null;
  branch?: Branch | null;
  fiscalyear?: FiscalYear | null;
  member: OrganizationMember | null;
  invitedorgs?: UserSessionInvitedOrganization[] | null;
  memberorgs: OrganizationMember[];
  ownorgs?: Organization[] | null;
  props?: UserProps | null;
}

export interface UserSessionStateModel {
  error: string | null;
  isLoading: boolean;
  session: UserSession | null;
}
