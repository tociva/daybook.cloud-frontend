import { PERMISSION } from '../../../../core/permissions/permission-requirements';
import type { PermissionMatch } from '../../../../core/permissions/permissions.model';
import type { PermissionsStore } from '../../../../core/permissions/permissions.store';

const reportPermissions: Readonly<Record<string, PermissionMatch>> = {
  accountantDashboard: PERMISSION.fiscalYear.accountingReports.accountantDashboard,
  balanceSheet: PERMISSION.fiscalYear.accountingReports.balanceSheet,
  ledgerCategoryReport: PERMISSION.fiscalYear.accountingReports.ledgerCategoryReport,
  ledgerReport: PERMISSION.fiscalYear.accountingReports.ledgerReport,
  profitLoss: PERMISSION.fiscalYear.accountingReports.profitLoss,
  taxReport: PERMISSION.branch.inventoryReports.taxReport,
  trialBalance: PERMISSION.fiscalYear.accountingReports.trialBalance,
};

export function accountingReportPermission(scope: string): PermissionMatch | null {
  return reportPermissions[scope] ?? null;
}

export function hasAccountingReportPermission(
  permissions: Pick<PermissionsStore, 'can'>,
  scope: string,
): boolean {
  const requirement = accountingReportPermission(scope);
  return requirement ? permissions.can(requirement) : false;
}
