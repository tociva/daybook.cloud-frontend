import { describe, expect, it } from 'vitest';
import type { AccountantDashboardActionKey } from './accountant-dashboard.model';
import {
  buildAccountantDashboardActionQueryParams,
  resolveAccountantDashboardActionRoute,
  resolveAccountantDashboardNavigationTarget,
} from './accountant-dashboard-actions';

const expectedRoutes: Readonly<Record<AccountantDashboardActionKey, string>> = {
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

const journalLinkFilterActionKeys = [
  'bankTransactions.pendingReconciliation',
  'payments.pendingJournal',
  'purchaseInvoices.pendingJournal',
  'receipts.pendingJournal',
  'saleInvoices.pendingJournal',
] as const satisfies readonly AccountantDashboardActionKey[];

function expectJournalLinkStatusFilterQueryParams(
  queryParams: ReturnType<typeof buildAccountantDashboardActionQueryParams>,
  actionKey: AccountantDashboardActionKey,
): void {
  expect(queryParams['burl']).toBe('/app/dashboard');
  expect(queryParams['dashboardAction']).toBe(actionKey);
  expect(JSON.parse(String(queryParams['filter']))).toEqual({
    where: {
      journallinkstatus: 'not_fully_linked',
    },
  });
  expect(queryParams['sourceType']).toBeUndefined();
  expect(queryParams['status']).toBeUndefined();
  expect(queryParams['limit']).toBeUndefined();
  expect(queryParams['skip']).toBeUndefined();
  expect(queryParams['order']).toBeUndefined();
}

describe('accountant dashboard action navigation', () => {
  it('resolves every action key to its target route', () => {
    for (const [actionKey, route] of Object.entries(expectedRoutes)) {
      expect(resolveAccountantDashboardActionRoute(actionKey as AccountantDashboardActionKey)).toBe(
        route,
      );
    }
  });

  it('adds dashboard handoff query params', () => {
    expect(buildAccountantDashboardActionQueryParams('receipts.pendingJournal')).toEqual({
      burl: '/app/dashboard',
      dashboardAction: 'receipts.pendingJournal',
      filter: JSON.stringify({
        where: {
          journallinkstatus: 'not_fully_linked',
        },
      }),
    });
    expect(resolveAccountantDashboardNavigationTarget('gst.gstr1')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'gst.gstr1',
      },
      route: '/app/trading/gst-reconciliation',
    });
  });

  it('adds normal journal-link status filter params for pending journal actions', () => {
    for (const actionKey of journalLinkFilterActionKeys) {
      const target = resolveAccountantDashboardNavigationTarget(actionKey);

      expect(target.route).toBe(expectedRoutes[actionKey]);
      expectJournalLinkStatusFilterQueryParams(target.queryParams, actionKey);
    }
  });

  it('does not add journal-link filter params for unrelated dashboard actions', () => {
    expect(resolveAccountantDashboardNavigationTarget('receipts.pendingAllocation')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'receipts.pendingAllocation',
      },
      route: '/app/trading/customer-receipt',
    });
  });
});
