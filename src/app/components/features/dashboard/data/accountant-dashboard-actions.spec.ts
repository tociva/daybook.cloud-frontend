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
      limit: 50,
      order: 'date ASC',
      skip: 0,
      sourceType: 'receipt',
      status: 'not_fully_linked',
    });
    expect(resolveAccountantDashboardNavigationTarget('gst.gstr1')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'gst.gstr1',
      },
      route: '/app/trading/gst-reconciliation',
    });
  });

  it('adds journal-link work item params only for supported actions', () => {
    const bankTarget = resolveAccountantDashboardNavigationTarget(
      'bankTransactions.pendingReconciliation',
    );
    expect(bankTarget.route).toBe('/app/accounting/banking');
    expect(bankTarget.queryParams['burl']).toBe('/app/dashboard');
    expect(bankTarget.queryParams['dashboardAction']).toBe(
      'bankTransactions.pendingReconciliation',
    );
    expect(JSON.parse(String(bankTarget.queryParams['filter']))).toEqual({
      where: {
        journallinkstatus: 'not_fully_linked',
      },
    });
    expect(bankTarget.queryParams['sourceType']).toBeUndefined();
    expect(bankTarget.queryParams['status']).toBeUndefined();
    expect(bankTarget.queryParams['limit']).toBeUndefined();
    expect(bankTarget.queryParams['skip']).toBeUndefined();
    expect(bankTarget.queryParams['order']).toBeUndefined();

    expect(resolveAccountantDashboardNavigationTarget('saleInvoices.pendingJournal')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'saleInvoices.pendingJournal',
        limit: 50,
        order: 'date ASC',
        skip: 0,
        sourceType: 'sale_invoice',
        status: 'not_fully_linked',
      },
      route: '/app/trading/sale-invoice',
    });

    expect(resolveAccountantDashboardNavigationTarget('receipts.pendingAllocation')).toEqual({
      queryParams: {
        burl: '/app/dashboard',
        dashboardAction: 'receipts.pendingAllocation',
      },
      route: '/app/trading/customer-receipt',
    });
  });
});
