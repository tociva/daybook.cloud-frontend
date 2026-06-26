import type { Branch } from '../branch/branch.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import {
  BRANCH_PERMISSION_GROUPS,
  FISCAL_YEAR_PERMISSION_GROUPS,
  ORGANIZATION_PERMISSION_GROUPS,
  type PermissionGroupDef,
} from './organization-member-permissions.schema';
import type {
  BranchScopePermissions,
  FiscalYearScopePermissions,
  OrganizationMemberPermissionTree,
  OrganizationScopePermissions,
  PermissionFlags,
} from './organization-member-permissions.model';

function createEmptyFlags(actions: readonly string[]): PermissionFlags {
  return Object.fromEntries(actions.map((key) => [key, false]));
}

function createEmptyFlagsFromGroup(group: PermissionGroupDef): PermissionFlags {
  return createEmptyFlags(group.actions.map((action) => action.key));
}

function createEmptyFiscalYearPermissions(): FiscalYearScopePermissions {
  return Object.fromEntries(
    FISCAL_YEAR_PERMISSION_GROUPS.map((group) => [group.key, createEmptyFlagsFromGroup(group)]),
  ) as FiscalYearScopePermissions;
}

function createEmptyBranchPermissions(fiscalYears: readonly FiscalYear[]): BranchScopePermissions {
  const branchGroups = Object.fromEntries(
    BRANCH_PERMISSION_GROUPS.map((group) => [group.key, createEmptyFlagsFromGroup(group)]),
  ) as Omit<BranchScopePermissions, 'fiscalyears'>;

  const fiscalyears = Object.fromEntries(
    fiscalYears
      .filter((fiscalYear): fiscalYear is FiscalYear & { id: string } => Boolean(fiscalYear.id))
      .map((fiscalYear) => [fiscalYear.id, createEmptyFiscalYearPermissions()]),
  );

  return {
    ...branchGroups,
    fiscalyears,
  };
}

function createEmptyOrganizationPermissions(branches: readonly Branch[]): OrganizationScopePermissions {
  const organizationGroups = Object.fromEntries(
    ORGANIZATION_PERMISSION_GROUPS.map((group) => [group.key, createEmptyFlagsFromGroup(group)]),
  ) as Pick<OrganizationScopePermissions, 'user' | 'branch'>;

  const branchEntries = branches
    .filter((branch): branch is Branch & { id: string } => Boolean(branch.id))
    .map((branch) => [branch.id, createEmptyBranchPermissions(branch.fiscalyears ?? [])] as const);

  return {
    ...organizationGroups,
    branches: Object.fromEntries(branchEntries),
  };
}

export function createEmptyPermissionTree(
  organizationId: string,
  branches: readonly Branch[],
): OrganizationMemberPermissionTree {
  return {
    organizations: {
      [organizationId]: createEmptyOrganizationPermissions(branches),
    },
  };
}

function mergeFlags(base: PermissionFlags, existing: unknown): PermissionFlags {
  const merged = { ...base };
  if (!existing || typeof existing !== 'object') {
    return merged;
  }

  for (const [key, value] of Object.entries(existing)) {
    if (key in merged && typeof value === 'boolean') {
      merged[key] = value;
    }
  }

  return merged;
}

function mergeFiscalYearPermissions(
  base: FiscalYearScopePermissions,
  existing: unknown,
): FiscalYearScopePermissions {
  if (!existing || typeof existing !== 'object') {
    return base;
  }

  const source = existing as Record<string, unknown>;
  return Object.fromEntries(
    FISCAL_YEAR_PERMISSION_GROUPS.map((group) => [
      group.key,
      mergeFlags(base[group.key as keyof FiscalYearScopePermissions], source[group.key]),
    ]),
  ) as FiscalYearScopePermissions;
}

function mergeBranchPermissions(
  base: BranchScopePermissions,
  existing: unknown,
): BranchScopePermissions {
  if (!existing || typeof existing !== 'object') {
    return base;
  }

  const source = existing as Record<string, unknown>;
  const mergedBranchGroups = Object.fromEntries(
    BRANCH_PERMISSION_GROUPS.map((group) => [
      group.key,
      mergeFlags(base[group.key as keyof BranchScopePermissions] as PermissionFlags, source[group.key]),
    ]),
  ) as Omit<BranchScopePermissions, 'fiscalyears'>;

  const existingFiscalYears =
    source['fiscalyears'] && typeof source['fiscalyears'] === 'object'
      ? (source['fiscalyears'] as Record<string, unknown>)
      : {};

  const mergedFiscalYears = Object.fromEntries(
    Object.entries(base.fiscalyears).map(([fiscalYearId, fiscalYearPermissions]) => [
      fiscalYearId,
      mergeFiscalYearPermissions(fiscalYearPermissions, existingFiscalYears[fiscalYearId]),
    ]),
  );

  return {
    ...mergedBranchGroups,
    fiscalyears: mergedFiscalYears,
  };
}

function mergeOrganizationPermissions(
  base: OrganizationScopePermissions,
  existing: unknown,
): OrganizationScopePermissions {
  if (!existing || typeof existing !== 'object') {
    return base;
  }

  const source = existing as Record<string, unknown>;
  const mergedOrganizationGroups = Object.fromEntries(
    ORGANIZATION_PERMISSION_GROUPS.map((group) => [
      group.key,
      mergeFlags(base[group.key as keyof OrganizationScopePermissions] as PermissionFlags, source[group.key]),
    ]),
  ) as Pick<OrganizationScopePermissions, 'user' | 'branch'>;

  const existingBranches =
    source['branches'] && typeof source['branches'] === 'object'
      ? (source['branches'] as Record<string, unknown>)
      : {};

  const mergedBranches = Object.fromEntries(
    Object.entries(base.branches).map(([branchId, branchPermissions]) => [
      branchId,
      mergeBranchPermissions(branchPermissions, existingBranches[branchId]),
    ]),
  );

  return {
    ...mergedOrganizationGroups,
    branches: mergedBranches,
  };
}

export function mergePermissionTree(
  base: OrganizationMemberPermissionTree,
  existing: OrganizationMemberPermissionTree | null | undefined,
): OrganizationMemberPermissionTree {
  if (!existing?.organizations) {
    return base;
  }

  const mergedOrganizations = Object.fromEntries(
    Object.entries(base.organizations).map(([organizationId, organizationPermissions]) => [
      organizationId,
      mergeOrganizationPermissions(
        organizationPermissions,
        existing.organizations[organizationId],
      ),
    ]),
  );

  return {
    organizations: mergedOrganizations,
  };
}

export function getFlagValues(flags: PermissionFlags, keys: readonly string[]): boolean[] {
  return keys.map((key) => Boolean(flags[key]));
}

export function isGroupFullyChecked(flags: PermissionFlags, keys: readonly string[]): boolean {
  return keys.length > 0 && keys.every((key) => Boolean(flags[key]));
}

export function isGroupPartiallyChecked(flags: PermissionFlags, keys: readonly string[]): boolean {
  const values = getFlagValues(flags, keys);
  return values.some(Boolean) && !values.every(Boolean);
}

export function toggleGroup(
  flags: PermissionFlags,
  keys: readonly string[],
  checked: boolean,
): PermissionFlags {
  const next = { ...flags };
  for (const key of keys) {
    if (key in next) {
      next[key] = checked;
    }
  }
  return next;
}

export function setFlag(
  tree: OrganizationMemberPermissionTree,
  organizationId: string,
  updater: (organization: OrganizationScopePermissions) => OrganizationScopePermissions,
): OrganizationMemberPermissionTree {
  const organization = tree.organizations[organizationId];
  if (!organization) {
    return tree;
  }

  return {
    organizations: {
      ...tree.organizations,
      [organizationId]: updater(organization),
    },
  };
}
