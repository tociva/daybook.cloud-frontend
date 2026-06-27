import { describe, expect, it } from 'vitest';
import { ACCOUNTING_REPORT_PERMISSIONS, PERMISSION } from '../../core/permissions/permission-requirements';
import type { PermissionMatch } from '../../core/permissions/permissions.model';
import { filterWorkspaceSidebarMenu } from './workspace-nav.model';

function exactMatch(allowed: readonly PermissionMatch[]): (permission: PermissionMatch) => boolean {
  return (permission) =>
    allowed.includes(permission) ||
    ('anyOf' in permission && permission.anyOf.some((child) => allowed.includes(child)));
}

describe('filterWorkspaceSidebarMenu', () => {
  it('removes denied children and empty groups and recalculates defaults', () => {
    const menu = filterWorkspaceSidebarMenu(exactMatch([PERMISSION.branch.vendor.view]));

    expect(menu.map((group) => group.name)).toEqual(['Trading']);
    expect(menu[0]?.children?.map((child) => child.name)).toEqual(['Vendor']);
    expect(menu[0]?.defaultPath).toBe('vendor');
  });

  it('shows Reports for any implemented report and Documents only for owner access', () => {
    const reportMenu = filterWorkspaceSidebarMenu(exactMatch([ACCOUNTING_REPORT_PERMISSIONS[0]]));
    expect(reportMenu.flatMap((group) => group.children ?? []).some((item) => item.name === 'Reports')).toBe(true);
    expect(reportMenu.flatMap((group) => group.children ?? []).some((item) => item.name === 'Documents')).toBe(false);

    const ownerMenu = filterWorkspaceSidebarMenu((permission) => permission === PERMISSION.ownerOnly);
    expect(ownerMenu.flatMap((group) => group.children ?? []).some((item) => item.name === 'Documents')).toBe(true);
  });
});
