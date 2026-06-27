import type {
  OrganizationMemberPermissionTree,
  SparseOrganizationMemberPermissionTree,
} from './organization-member-permissions.model';

export type OrganizationMemberPermissions =
  | OrganizationMemberPermissionTree
  | SparseOrganizationMemberPermissionTree;
