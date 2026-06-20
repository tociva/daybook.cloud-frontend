import type { Params } from '@angular/router';
import { JOURNAL_LINK_STATUS_NOT_FULLY_LINKED_FILTER } from '../../accounting/shared/journal-link-status-filter';
import type { AccountantDashboardActionKey } from './accountant-dashboard.model';

export const ACCOUNTANT_DASHBOARD_HOME = '/app/dashboard';

export const ACCOUNTANT_DASHBOARD_ROUTE_BY_ACTION_KEY: Readonly<
  Record<AccountantDashboardActionKey, string>
> = {
  'bankTransactions.pendingReconciliation': '/app/accounting/banking',
  'gst.gstr1': '/app/trading/gst-reconciliation',
  'gst.gstr2b': '/app/trading/gst-reconciliation',
  'payments.pendingAllocation': '/app/trading/vendor-payment',
  'payments.pendingJournal': '/app/trading/vendor-payment',
  'purchaseInvoices.pendingJournal': '/app/trading/purchase-invoice',
  'receipts.pendingAllocation': '/app/trading/customer-receipt',
  'receipts.pendingJournal': '/app/trading/customer-receipt',
  'saleInvoices.pendingJournal': '/app/trading/sale-invoice',
};

const ACCOUNTANT_DASHBOARD_JOURNAL_LINK_FILTER_ACTION_KEYS = new Set<AccountantDashboardActionKey>([
  'bankTransactions.pendingReconciliation',
  'payments.pendingJournal',
  'purchaseInvoices.pendingJournal',
  'receipts.pendingJournal',
  'saleInvoices.pendingJournal',
]);

export type AccountantDashboardNavigationTarget = Readonly<{
  queryParams: Params;
  route: string;
}>;

export function resolveAccountantDashboardActionRoute(
  actionKey: AccountantDashboardActionKey,
): string {
  return ACCOUNTANT_DASHBOARD_ROUTE_BY_ACTION_KEY[actionKey];
}

export function buildAccountantDashboardActionQueryParams(
  actionKey: AccountantDashboardActionKey,
): Params {
  if (ACCOUNTANT_DASHBOARD_JOURNAL_LINK_FILTER_ACTION_KEYS.has(actionKey)) {
    return {
      burl: ACCOUNTANT_DASHBOARD_HOME,
      dashboardAction: actionKey,
      filter: JSON.stringify(JOURNAL_LINK_STATUS_NOT_FULLY_LINKED_FILTER),
    };
  }

  return {
    burl: ACCOUNTANT_DASHBOARD_HOME,
    dashboardAction: actionKey,
  };
}

export function resolveAccountantDashboardNavigationTarget(
  actionKey: AccountantDashboardActionKey,
): AccountantDashboardNavigationTarget {
  return {
    queryParams: buildAccountantDashboardActionQueryParams(actionKey),
    route: resolveAccountantDashboardActionRoute(actionKey),
  };
}
