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
    });
    expect(resolveAccountantDashboardNavigationTarget('gst.gstr1')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'gst.gstr1',
      },
      route: '/app/trading/gst-reconciliation',
    });
  });
});

