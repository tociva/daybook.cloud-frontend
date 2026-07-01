import {
  allPermissions,
  anyPermission,
  ownerOnlyPermission,
  permission,
  type PermissionMatch,
  type PermissionRequirement,
} from './permissions.model';

const root = (resource: string, action: string): PermissionRequirement =>
  permission('root', resource, action);
const organization = (resource: string, action: string): PermissionRequirement =>
  permission('organization', resource, action);
const branch = (resource: string, action: string): PermissionRequirement =>
  permission('branch', resource, action);
const fiscalYear = (resource: string, action: string): PermissionRequirement =>
  permission('fiscalYear', resource, action);

const crud = (
  factory: (resource: string, action: string) => PermissionRequirement,
  resource: string,
) => ({
  create: factory(resource, 'create'),
  delete: factory(resource, 'delete'),
  update: factory(resource, 'update'),
  view: factory(resource, 'view'),
});

export const PERMISSION = {
  root: {
    organization: {
      ...crud(root, 'organization'),
      bootstrap: root('organization', 'bootstrap'),
      bootstrapWithData: root('organization', 'bootstrapWithData'),
    },
    userSubscription: {
      view: root('userSubscription', 'viewSubscription'),
    },
  },
  organization: {
    branch: {
      ...crud(organization, 'branch'),
      deleteInvoiceTemplate: organization('branch', 'deleteInvoiceTemplate'),
      uploadInvoiceTemplate: organization('branch', 'uploadInvoiceTemplate'),
      viewInvoiceTemplate: organization('branch', 'viewInvoiceTemplate'),
    },
    organizationDocument: crud(organization, 'organizationDocument'),
    organizationLogoDocument: crud(organization, 'organizationLogoDocument'),
    user: {
      invite: organization('user', 'inviteMember'),
      remove: organization('user', 'removeMember'),
      update: organization('user', 'updateMember'),
      view: organization('user', 'viewMember'),
    },
  },
  branch: {
    bankCash: { ...crud(branch, 'bankCash'), bulkUpload: branch('bankCash', 'bulkUpload') },
    contraTransaction: crud(branch, 'contraTransaction'),
    customer: { ...crud(branch, 'customer'), bulkUpload: branch('customer', 'bulkUpload') },
    customerReceipt: {
      ...crud(branch, 'customerReceipt'),
      bulkUpload: branch('customerReceipt', 'bulkUpload'),
    },
    fiscalYear: crud(branch, 'fiscalYear'),
    inventoryReports: {
      bankCashReport: branch('inventoryReports', 'bankCashReport'),
      taxReport: branch('inventoryReports', 'taxReport'),
    },
    item: { ...crud(branch, 'item'), bulkUpload: branch('item', 'bulkUpload') },
    itemCategory: {
      ...crud(branch, 'itemCategory'),
      bulkUpload: branch('itemCategory', 'bulkUpload'),
    },
    purchaseInvoice: {
      ...crud(branch, 'purchaseInvoice'),
      bulkUpload: branch('purchaseInvoice', 'bulkUpload'),
    },
    purchaseInvoiceDocument: crud(branch, 'purchaseInvoiceDocument'),
    purchaseReturn: {
      ...crud(branch, 'purchaseReturn'),
      bulkUpload: branch('purchaseReturn', 'bulkUpload'),
    },
    purchaseReturnDocument: crud(branch, 'purchaseReturnDocument'),
    saleInvoice: {
      ...crud(branch, 'saleInvoice'),
      bulkUpload: branch('saleInvoice', 'bulkUpload'),
    },
    saleInvoiceDocument: crud(branch, 'saleInvoiceDocument'),
    saleInvoiceTemplateDocument: crud(branch, 'saleInvoiceTemplateDocument'),
    tax: { ...crud(branch, 'tax'), bulkUpload: branch('tax', 'bulkUpload') },
    taxGroup: { ...crud(branch, 'taxGroup'), bulkUpload: branch('taxGroup', 'bulkUpload') },
    vendor: { ...crud(branch, 'vendor'), bulkUpload: branch('vendor', 'bulkUpload') },
    vendorPayment: {
      ...crud(branch, 'vendorPayment'),
      bulkUpload: branch('vendorPayment', 'bulkUpload'),
    },
  },
  fiscalYear: {
    accountingReports: {
      accountantDashboard: fiscalYear('accountingReports', 'accountantDashboard'),
      balanceSheet: fiscalYear('accountingReports', 'balanceSheet'),
      ledgerCategoryReport: fiscalYear('accountingReports', 'ledgerCategoryReport'),
      ledgerReport: fiscalYear('accountingReports', 'ledgerReport'),
      profitLoss: fiscalYear('accountingReports', 'profitLoss'),
      trialBalance: fiscalYear('accountingReports', 'trialBalance'),
    },
    bankTxn: { ...crud(fiscalYear, 'bankTxn'), bulkUpload: fiscalYear('bankTxn', 'bulkUpload') },
    bankTxnReconciliation: crud(fiscalYear, 'bankTxnReconciliation'),
    contraTransactionReconciliation: crud(fiscalYear, 'contraTransactionReconciliation'),
    customerReceiptReconciliation: crud(fiscalYear, 'customerReceiptReconciliation'),
    gstReconciliation: {
      ...crud(fiscalYear, 'gstReconciliation'),
      bulkUpload: fiscalYear('gstReconciliation', 'bulkUpload'),
    },
    gstReconciliationDocument: crud(fiscalYear, 'gstReconciliationDocument'),
    inventoryLedgerMap: {
      ...crud(fiscalYear, 'inventoryLedgerMap'),
      bulkUpload: fiscalYear('inventoryLedgerMap', 'bulkUpload'),
    },
    journal: {
      ...crud(fiscalYear, 'journal'),
      bulkUpload: fiscalYear('journal', 'bulkUpload'),
    },
    journalDocument: crud(fiscalYear, 'journalDocument'),
    ledger: { ...crud(fiscalYear, 'ledger'), bulkUpload: fiscalYear('ledger', 'bulkUpload') },
    ledgerCategory: {
      ...crud(fiscalYear, 'ledgerCategory'),
      bulkUpload: fiscalYear('ledgerCategory', 'bulkUpload'),
    },
    purchaseInvoiceReconciliation: crud(fiscalYear, 'purchaseInvoiceReconciliation'),
    saleInvoiceReconciliation: crud(fiscalYear, 'saleInvoiceReconciliation'),
    vendorPaymentReconciliation: crud(fiscalYear, 'vendorPaymentReconciliation'),
  },
  ownerOnly: ownerOnlyPermission,
} as const;

export const ACCOUNTING_REPORT_PERMISSIONS = [
  PERMISSION.fiscalYear.accountingReports.trialBalance,
  PERMISSION.fiscalYear.accountingReports.profitLoss,
  PERMISSION.fiscalYear.accountingReports.balanceSheet,
  PERMISSION.fiscalYear.accountingReports.ledgerReport,
  PERMISSION.fiscalYear.accountingReports.ledgerCategoryReport,
] as const;

export const ACCOUNTING_REPORTS_MATCH = anyPermission(
  ...ACCOUNTING_REPORT_PERMISSIONS,
  PERMISSION.branch.inventoryReports.taxReport,
);

export const ITEM_TREE_MATCH = allPermissions(
  PERMISSION.branch.item.view,
  PERMISSION.branch.itemCategory.view,
);

export const LEDGER_TREE_MATCH = allPermissions(
  PERMISSION.fiscalYear.ledger.view,
  PERMISSION.fiscalYear.ledgerCategory.view,
);

type CrudPermissionSet = Readonly<{
  create: PermissionRequirement;
  delete: PermissionRequirement;
  update: PermissionRequirement;
  view: PermissionRequirement;
}>;

function crudRoutePermission(
  path: string,
  base: string,
  permissions: CrudPermissionSet,
): PermissionMatch | null {
  if (path === base) return permissions.view;
  if (path === `${base}/create`) return permissions.create;
  if (!path.startsWith(`${base}/`)) return null;

  const suffix = path
    .slice(base.length + 1)
    .split('/')
    .filter(Boolean);
  if (suffix.length === 1) return permissions.view;
  if (suffix.length === 2 && suffix[1] === 'edit') return permissions.update;
  if (suffix.length === 2 && suffix[1] === 'delete') return permissions.delete;
  return null;
}

function normalizeWorkspacePath(url: string): string {
  const path = (url.split(/[?#]/)[0] ?? '/').replace(/\/+$/, '');
  return path || '/';
}

export function permissionForWorkspaceUrl(url: string): PermissionMatch | null {
  const path = normalizeWorkspacePath(url);

  if (path === '/app/dashboard') return PERMISSION.fiscalYear.accountingReports.accountantDashboard;
  if (path === '/app/management/subscription') return PERMISSION.root.userSubscription.view;

  const reportRoutes: ReadonlyArray<readonly [string, PermissionMatch]> = [
    ['/app/accounting/reports/trial-balance', PERMISSION.fiscalYear.accountingReports.trialBalance],
    ['/app/accounting/reports/profit-loss', PERMISSION.fiscalYear.accountingReports.profitLoss],
    ['/app/accounting/reports/balance-sheet', PERMISSION.fiscalYear.accountingReports.balanceSheet],
    ['/app/accounting/reports/tax', PERMISSION.branch.inventoryReports.taxReport],
    [
      '/app/accounting/reports/ledger-category',
      PERMISSION.fiscalYear.accountingReports.ledgerCategoryReport,
    ],
    ['/app/accounting/reports/ledger', PERMISSION.fiscalYear.accountingReports.ledgerReport],
  ];
  for (const [base, match] of reportRoutes) {
    if (path === base || path.startsWith(`${base}/`)) return match;
  }
  if (path === '/app/accounting/reports') return ACCOUNTING_REPORTS_MATCH;

  if (path === '/app/trading/item/tree-view') return ITEM_TREE_MATCH;
  if (path === '/app/accounting/ledger/tree-view') return LEDGER_TREE_MATCH;
  if (path === '/app/trading/bank-cash/activity')
    return PERMISSION.branch.inventoryReports.bankCashReport;
  if (path === '/app/trading/bank-cash/contra') return PERMISSION.branch.contraTransaction.view;
  if (path === '/app/trading/bank-cash/contra/create')
    return PERMISSION.branch.contraTransaction.create;
  if (/^\/app\/trading\/bank-cash\/contra\/[^/]+\/edit$/.test(path))
    return PERMISSION.branch.contraTransaction.update;
  if (/^\/app\/trading\/bank-cash\/contra\/[^/]+\/delete$/.test(path))
    return PERMISSION.branch.contraTransaction.delete;
  if (/^\/app\/trading\/bank-cash\/contra\/[^/]+$/.test(path))
    return PERMISSION.branch.contraTransaction.view;
  if (/^\/app\/trading\/sale-invoice\/[^/]+\/receipts$/.test(path))
    return PERMISSION.branch.customerReceipt.view;
  if (/^\/app\/trading\/purchase-invoice\/[^/]+\/payments$/.test(path))
    return PERMISSION.branch.vendorPayment.view;
  if (
    path === '/app/trading/gst-reconciliation' ||
    path.startsWith('/app/trading/gst-reconciliation/')
  ) {
    return PERMISSION.fiscalYear.gstReconciliation.view;
  }
  if (path === '/app/accounting/documents' || path.startsWith('/app/accounting/documents/')) {
    return PERMISSION.ownerOnly;
  }

  const usersBase = '/app/management/users';
  if (path === usersBase) return PERMISSION.organization.user.view;
  if (path === `${usersBase}/create`) return PERMISSION.organization.user.invite;
  if (/^\/app\/management\/users\/[^/]+\/edit$/.test(path))
    return PERMISSION.organization.user.update;
  if (/^\/app\/management\/users\/[^/]+\/delete$/.test(path))
    return PERMISSION.organization.user.remove;
  if (path.startsWith(`${usersBase}/`)) return PERMISSION.organization.user.view;

  const vendorPaymentBase = '/app/trading/vendor-payment';
  if (path === vendorPaymentBase) return PERMISSION.branch.vendorPayment.view;
  if (path === `${vendorPaymentBase}/create`) return PERMISSION.branch.vendorPayment.create;
  if (/^\/app\/trading\/vendor-payment\/[^/]+$/.test(path))
    return PERMISSION.branch.vendorPayment.view;
  if (/^\/app\/trading\/vendor-payment\/[^/]+\/edit$/.test(path))
    return PERMISSION.branch.vendorPayment.update;
  if (/^\/app\/trading\/vendor-payment\/[^/]+\/delete$/.test(path))
    return PERMISSION.branch.vendorPayment.delete;

  const routes: ReadonlyArray<readonly [string, CrudPermissionSet]> = [
    ['/app/management/organization', PERMISSION.root.organization],
    ['/app/management/branch', PERMISSION.organization.branch],
    ['/app/management/fiscal-year', PERMISSION.branch.fiscalYear],
    ['/app/trading/bank-cash', PERMISSION.branch.bankCash],
    ['/app/trading/tax-group', PERMISSION.branch.taxGroup],
    ['/app/trading/tax', PERMISSION.branch.tax],
    ['/app/trading/item-category', PERMISSION.branch.itemCategory],
    ['/app/trading/item', PERMISSION.branch.item],
    ['/app/trading/vendor', PERMISSION.branch.vendor],
    ['/app/trading/customer', PERMISSION.branch.customer],
    ['/app/trading/sale-invoice', PERMISSION.branch.saleInvoice],
    ['/app/trading/customer-receipt', PERMISSION.branch.customerReceipt],
    ['/app/trading/purchase-invoice', PERMISSION.branch.purchaseInvoice],
    ['/app/trading/purchase-return', PERMISSION.branch.purchaseReturn],
    ['/app/accounting/ledger-category', PERMISSION.fiscalYear.ledgerCategory],
    ['/app/accounting/ledger', PERMISSION.fiscalYear.ledger],
    ['/app/accounting/inventory-ledger-map', PERMISSION.fiscalYear.inventoryLedgerMap],
    ['/app/accounting/journal', PERMISSION.fiscalYear.journal],
    ['/app/accounting/banking', PERMISSION.fiscalYear.bankTxn],
  ];

  for (const [base, permissions] of routes) {
    const match = crudRoutePermission(path, base, permissions);
    if (match) return match;
  }

  return null;
}

export function permissionForCurrentResourceAction(
  url: string,
  action: 'create' | 'delete' | 'update' | 'view',
): PermissionMatch | null {
  const current = permissionForWorkspaceUrl(url);
  if (!current) return null;
  if (!('level' in current)) return current;

  if (current.level === 'organization' && current.resource === 'user') {
    const userActions = {
      create: 'inviteMember',
      delete: 'removeMember',
      update: 'updateMember',
      view: 'viewMember',
    } as const;
    return { ...current, action: userActions[action] };
  }

  return { ...current, action };
}

const bulkUploadPermissions: Readonly<Record<string, PermissionMatch>> = {
  '/accounting/journal/bulk-upload': PERMISSION.fiscalYear.journal.bulkUpload,
  '/accounting/ledger-category/bulk-upload': PERMISSION.fiscalYear.ledgerCategory.bulkUpload,
  '/accounting/ledger/bulk-upload': PERMISSION.fiscalYear.ledger.bulkUpload,
  '/inventory/bank-cash/bulk-upload': PERMISSION.branch.bankCash.bulkUpload,
  '/inventory/customer-receipt/bulk-upload': PERMISSION.branch.customerReceipt.bulkUpload,
  '/inventory/customer/bulk-upload': PERMISSION.branch.customer.bulkUpload,
  '/inventory/item-category/bulk-upload': PERMISSION.branch.itemCategory.bulkUpload,
  '/inventory/item/bulk-upload': PERMISSION.branch.item.bulkUpload,
  '/inventory/purchase-invoice/bulk-upload': PERMISSION.branch.purchaseInvoice.bulkUpload,
  '/inventory/sale-invoice/bulk-upload': PERMISSION.branch.saleInvoice.bulkUpload,
  '/inventory/tax-group/bulk-upload': PERMISSION.branch.taxGroup.bulkUpload,
  '/inventory/tax/bulk-upload': PERMISSION.branch.tax.bulkUpload,
  '/inventory/vendor-payment/bulk-upload': PERMISSION.branch.vendorPayment.bulkUpload,
  '/inventory/vendor/bulk-upload': PERMISSION.branch.vendor.bulkUpload,
};

export function permissionForBulkUploadEndpoint(endpoint: string): PermissionMatch | null {
  return bulkUploadPermissions[endpoint] ?? null;
}

export const WORKSPACE_PERMISSION_DESTINATIONS: readonly Readonly<{
  path: string;
  permission: PermissionMatch;
}>[] = [
  { path: '/app/trading/bank-cash', permission: PERMISSION.branch.bankCash.view },
  { path: '/app/trading/tax', permission: PERMISSION.branch.tax.view },
  { path: '/app/trading/item', permission: PERMISSION.branch.item.view },
  { path: '/app/trading/customer', permission: PERMISSION.branch.customer.view },
  { path: '/app/trading/sale-invoice', permission: PERMISSION.branch.saleInvoice.view },
  { path: '/app/trading/customer-receipt', permission: PERMISSION.branch.customerReceipt.view },
  { path: '/app/trading/vendor', permission: PERMISSION.branch.vendor.view },
  { path: '/app/trading/purchase-invoice', permission: PERMISSION.branch.purchaseInvoice.view },
  { path: '/app/trading/vendor-payment', permission: PERMISSION.branch.vendorPayment.view },
  {
    path: '/app/trading/gst-reconciliation',
    permission: PERMISSION.fiscalYear.gstReconciliation.view,
  },
  { path: '/app/trading/purchase-return', permission: PERMISSION.branch.purchaseReturn.view },
  { path: '/app/accounting/ledger', permission: PERMISSION.fiscalYear.ledger.view },
  { path: '/app/accounting/journal', permission: PERMISSION.fiscalYear.journal.view },
  { path: '/app/accounting/documents', permission: PERMISSION.ownerOnly },
  { path: '/app/accounting/banking', permission: PERMISSION.fiscalYear.bankTxn.view },
  {
    path: '/app/accounting/inventory-ledger-map',
    permission: PERMISSION.fiscalYear.inventoryLedgerMap.view,
  },
  { path: '/app/accounting/reports', permission: ACCOUNTING_REPORTS_MATCH },
  { path: '/app/management/organization', permission: PERMISSION.root.organization.view },
  { path: '/app/management/branch', permission: PERMISSION.organization.branch.view },
  { path: '/app/management/fiscal-year', permission: PERMISSION.branch.fiscalYear.view },
  { path: '/app/management/subscription', permission: PERMISSION.root.userSubscription.view },
  { path: '/app/management/users', permission: PERMISSION.organization.user.view },
];

export type DocumentPermissionResource =
  | 'journal'
  | 'purchaseInvoice'
  | 'purchaseReturn'
  | 'saleInvoice';

const DOCUMENT_PERMISSIONS = {
  journal: PERMISSION.fiscalYear.journalDocument,
  purchaseInvoice: PERMISSION.branch.purchaseInvoiceDocument,
  purchaseReturn: PERMISSION.branch.purchaseReturnDocument,
  saleInvoice: PERMISSION.branch.saleInvoiceDocument,
} as const;

export function documentPermission(
  resource: DocumentPermissionResource,
  action: 'create' | 'delete' | 'view',
): PermissionRequirement {
  return DOCUMENT_PERMISSIONS[resource][action];
}
