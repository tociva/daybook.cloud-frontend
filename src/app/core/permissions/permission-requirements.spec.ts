import { describe, expect, it } from 'vitest';
import {
  ITEM_TREE_MATCH,
  LEDGER_TREE_MATCH,
  PERMISSION,
  permissionForBulkUploadEndpoint,
  permissionForWorkspaceUrl,
} from './permission-requirements';

describe('permissionForWorkspaceUrl', () => {
  it('maps CRUD routes to their exact actions', () => {
    expect(permissionForWorkspaceUrl('/app/trading/customer')).toEqual(PERMISSION.branch.customer.view);
    expect(permissionForWorkspaceUrl('/app/trading/customer/create')).toEqual(PERMISSION.branch.customer.create);
    expect(permissionForWorkspaceUrl('/app/trading/customer/customer-1')).toEqual(PERMISSION.branch.customer.view);
    expect(permissionForWorkspaceUrl('/app/trading/customer/customer-1/edit')).toEqual(PERMISSION.branch.customer.update);
    expect(permissionForWorkspaceUrl('/app/trading/customer/customer-1/delete')).toEqual(PERMISSION.branch.customer.delete);
  });

  it('maps composite trees, reports, Documents, and Subscription', () => {
    expect(permissionForWorkspaceUrl('/app/trading/item/tree-view')).toEqual(ITEM_TREE_MATCH);
    expect(permissionForWorkspaceUrl('/app/accounting/ledger/tree-view')).toEqual(LEDGER_TREE_MATCH);
    expect(permissionForWorkspaceUrl('/app/accounting/reports/trial-balance')).toEqual(
      PERMISSION.fiscalYear.accountingReports.trialBalance,
    );
    expect(permissionForWorkspaceUrl('/app/accounting/documents')).toEqual(PERMISSION.ownerOnly);
    expect(permissionForWorkspaceUrl('/app/management/subscription')).toEqual(
      PERMISSION.root.userSubscription.view,
    );
  });

  it('uses the backend bank-statement upload permission and denies unknown endpoints', () => {
    expect(permissionForWorkspaceUrl('/app/accounting/banking/create')).toEqual(
      PERMISSION.fiscalYear.bankTxn.create,
    );
    expect(permissionForBulkUploadEndpoint('/accounting/journal/bulk-upload')).toEqual(
      PERMISSION.fiscalYear.journal.bulkUpload,
    );
    expect(permissionForBulkUploadEndpoint('/unknown')).toBeNull();
  });
});
