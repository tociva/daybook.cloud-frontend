/** Matches backend accountingReports scopes (e.g. ledgerReport, trialBalance). */
export function hasAccountingReportPermission(
  permissions: readonly string[],
  scope: string,
): boolean {
  if (!permissions.length) return true;

  const normalizedScope = scope.toLowerCase();
  return permissions.some((permission) => {
    const normalized = permission.toLowerCase();
    return (
      normalized === `accountingreports.${normalizedScope}` ||
      normalized === `accountingreports:${normalizedScope}` ||
      (normalized.includes('accountingreports') && normalized.includes(normalizedScope))
    );
  });
}
