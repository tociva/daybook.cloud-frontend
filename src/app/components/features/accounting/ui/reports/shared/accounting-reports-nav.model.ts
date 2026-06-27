export const ACCOUNTING_REPORTS_BASE_PATH = '/app/accounting/reports';

export type AccountingReportNavItem = Readonly<{
  description: string;
  icon: string;
  label: string;
  permissionScope: string;
  route: string;
  slug: string;
}>;

export const accountingReportsNavItems: readonly AccountingReportNavItem[] = [
  {
    slug: 'trial-balance',
    label: 'Trial balance',
    route: `${ACCOUNTING_REPORTS_BASE_PATH}/trial-balance`,
    description: 'Ledger balances for the selected period',
    icon: 'scale',
    permissionScope: 'trialBalance',
  },
  {
    slug: 'profit-loss',
    label: 'Profit and loss',
    route: `${ACCOUNTING_REPORTS_BASE_PATH}/profit-loss`,
    description: 'Income and expense summary for the selected period',
    icon: 'trendingUp',
    permissionScope: 'profitLoss',
  },
  {
    slug: 'balance-sheet',
    label: 'Balance sheet',
    route: `${ACCOUNTING_REPORTS_BASE_PATH}/balance-sheet`,
    description: 'Assets, liabilities, and equity as of a date',
    icon: 'landmark',
    permissionScope: 'balanceSheet',
  },
  {
    slug: 'ledger',
    label: 'Ledger report',
    route: `${ACCOUNTING_REPORTS_BASE_PATH}/ledger`,
    description: 'Account activity and running balance for the selected period',
    icon: 'bookOpen',
    permissionScope: 'ledgerReport',
  },
  {
    slug: 'ledger-category',
    label: 'Ledger category report',
    route: `${ACCOUNTING_REPORTS_BASE_PATH}/ledger-category`,
    description: 'Category-level activity and balances for the selected period',
    icon: 'layers',
    permissionScope: 'ledgerCategoryReport',
  },
];

export function findAccountingReportBySlug(slug: string): AccountingReportNavItem | undefined {
  return accountingReportsNavItems.find((item) => item.slug === slug);
}

export function findAccountingReportByRoute(path: string): AccountingReportNavItem | undefined {
  const normalized = path.split('?')[0] ?? '';

  return [...accountingReportsNavItems]
    .sort((a, b) => b.route.length - a.route.length)
    .find((item) => normalized === item.route || normalized.startsWith(`${item.route}/`));
}

export function isAccountingReportsSectionRoute(path: string): boolean {
  const normalized = path.split('?')[0] ?? '';

  return (
    normalized === ACCOUNTING_REPORTS_BASE_PATH ||
    normalized.startsWith(`${ACCOUNTING_REPORTS_BASE_PATH}/`) ||
    findAccountingReportByRoute(normalized) !== undefined
  );
}
