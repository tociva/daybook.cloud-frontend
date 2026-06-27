export type PermissionLevel = 'root' | 'organization' | 'branch' | 'fiscalYear';

export type PermissionRequirement = Readonly<{
  level: PermissionLevel;
  resource: string;
  action: string;
}>;

export type PermissionMatch =
  | PermissionRequirement
  | Readonly<{ allOf: readonly PermissionMatch[] }>
  | Readonly<{ anyOf: readonly PermissionMatch[] }>
  | Readonly<{ ownerOnly: true }>;

export function permission(
  level: PermissionLevel,
  resource: string,
  action: string,
): PermissionRequirement {
  return { level, resource, action };
}

export function allPermissions(...requirements: readonly PermissionMatch[]): PermissionMatch {
  return { allOf: requirements };
}

export function anyPermission(...requirements: readonly PermissionMatch[]): PermissionMatch {
  return { anyOf: requirements };
}

export const ownerOnlyPermission: PermissionMatch = { ownerOnly: true };
