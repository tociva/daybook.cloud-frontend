import type { Params } from '@angular/router';
import { JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT } from '../../accounting/data/journal-link-work-item';
import type {
  JournalLinkWorkItemQuery,
  JournalLinkWorkItemSourceType,
} from '../../accounting/data/journal-link-work-item';
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

export const ACCOUNTANT_DASHBOARD_JOURNAL_LINK_SOURCE_BY_ACTION_KEY: Readonly<
  Partial<Record<AccountantDashboardActionKey, JournalLinkWorkItemSourceType>>
> = {
  'payments.pendingJournal': 'payment',
  'purchaseInvoices.pendingJournal': 'purchase_invoice',
  'receipts.pendingJournal': 'receipt',
  'saleInvoices.pendingJournal': 'sale_invoice',
};

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
  if (actionKey === 'bankTransactions.pendingReconciliation') {
    return {
      burl: ACCOUNTANT_DASHBOARD_HOME,
      dashboardAction: actionKey,
      filter: JSON.stringify({
        where: {
          journallinkstatus: 'not_fully_linked',
        },
      }),
    };
  }

  const journalLinkSourceType = ACCOUNTANT_DASHBOARD_JOURNAL_LINK_SOURCE_BY_ACTION_KEY[actionKey];
  const journalLinkQuery: JournalLinkWorkItemQuery | undefined = journalLinkSourceType
    ? {
        limit: JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT,
        order: 'date ASC',
        skip: 0,
        sourceType: journalLinkSourceType,
        status: 'not_fully_linked',
      }
    : undefined;

  return {
    burl: ACCOUNTANT_DASHBOARD_HOME,
    dashboardAction: actionKey,
    ...(journalLinkQuery ?? {}),
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
