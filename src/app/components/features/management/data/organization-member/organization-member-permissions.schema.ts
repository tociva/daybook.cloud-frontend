export type PermissionActionDef = Readonly<{
  key: string;
  label: string;
}>;

export type PermissionGroupDef = Readonly<{
  key: string;
  label: string;
  actions: readonly PermissionActionDef[];
}>;

const action = (key: string, label?: string): PermissionActionDef => ({
  key,
  label: label ?? formatPermissionLabel(key),
});

const crud = (): readonly PermissionActionDef[] => [
  action('create'),
  action('update'),
  action('view'),
  action('delete'),
];

const crudWithBulkUpload = (): readonly PermissionActionDef[] => [
  ...crud(),
  action('bulkUpload'),
];

const crudWithDocuments = (): readonly PermissionActionDef[] => [
  ...crudWithBulkUpload(),
  action('createDocument'),
  action('deleteDocument'),
];

const reconciliation = (): readonly PermissionActionDef[] => crud();

export function formatPermissionLabel(key: string): string {
  const withSpaces = key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
}

export const ORGANIZATION_PERMISSION_GROUPS: readonly PermissionGroupDef[] = [
  {
    key: 'user',
    label: 'User',
    actions: [action('inviteMember'), action('removeMember'), action('updateMember')],
  },
  {
    key: 'branch',
    label: 'Branch',
    actions: [
      ...crud(),
      action('uploadInvoiceTemplate'),
      action('viewInvoiceTemplate'),
      action('deleteInvoiceTemplate'),
    ],
  },
] as const;

export const BRANCH_PERMISSION_GROUPS: readonly PermissionGroupDef[] = [
  { key: 'fiscalYear', label: 'Fiscal year', actions: crud() },
  { key: 'item', label: 'Item', actions: crudWithBulkUpload() },
  { key: 'itemCategory', label: 'Item category', actions: crudWithBulkUpload() },
  { key: 'tax', label: 'Tax', actions: crudWithBulkUpload() },
  { key: 'taxGroup', label: 'Tax group', actions: crudWithBulkUpload() },
  { key: 'customer', label: 'Customer', actions: crudWithBulkUpload() },
  { key: 'vendor', label: 'Vendor', actions: crudWithBulkUpload() },
  { key: 'purchaseInvoice', label: 'Purchase invoice', actions: crudWithDocuments() },
  { key: 'saleInvoice', label: 'Sale invoice', actions: crudWithDocuments() },
  { key: 'purchaseReturn', label: 'Purchase return', actions: crudWithDocuments() },
  { key: 'customerReceipt', label: 'Customer receipt', actions: crudWithBulkUpload() },
  { key: 'vendorPayment', label: 'Vendor payment', actions: crudWithBulkUpload() },
  { key: 'bankCash', label: 'Bank cash', actions: crudWithBulkUpload() },
  { key: 'contraTransaction', label: 'Contra transaction', actions: crud() },
  {
    key: 'inventoryReports',
    label: 'Inventory reports',
    actions: [action('bankCashReport')],
  },
] as const;

export const FISCAL_YEAR_PERMISSION_GROUPS: readonly PermissionGroupDef[] = [
  { key: 'journal', label: 'Journal', actions: crudWithDocuments() },
  { key: 'ledger', label: 'Ledger', actions: crudWithBulkUpload() },
  { key: 'ledgerCategory', label: 'Ledger category', actions: crudWithBulkUpload() },
  {
    key: 'accountingReports',
    label: 'Accounting reports',
    actions: [
      action('trialBalance'),
      action('profitLoss'),
      action('balanceSheet'),
      action('ledgerReport'),
      action('ledgerCategoryReport'),
      action('accountantDashboard'),
    ],
  },
  { key: 'inventoryLedgerMap', label: 'Inventory ledger map', actions: crudWithBulkUpload() },
  { key: 'bankTxn', label: 'Bank transaction', actions: crudWithBulkUpload() },
  { key: 'bankTxnReconciliation', label: 'Bank transaction reconciliation', actions: reconciliation() },
  {
    key: 'saleInvoiceReconciliation',
    label: 'Sale invoice reconciliation',
    actions: reconciliation(),
  },
  {
    key: 'purchaseInvoiceReconciliation',
    label: 'Purchase invoice reconciliation',
    actions: reconciliation(),
  },
  {
    key: 'customerReceiptReconciliation',
    label: 'Customer receipt reconciliation',
    actions: reconciliation(),
  },
  {
    key: 'vendorPaymentReconciliation',
    label: 'Vendor payment reconciliation',
    actions: reconciliation(),
  },
  {
    key: 'contraTransactionReconciliation',
    label: 'Contra transaction reconciliation',
    actions: reconciliation(),
  },
  { key: 'gstReconciliation', label: 'GST reconciliation', actions: crudWithBulkUpload() },
] as const;

export function getGroupActionKeys(groups: readonly PermissionGroupDef[]): readonly string[] {
  return groups.flatMap((group) => group.actions.map((entry) => entry.key));
}

export type PermissionScopeLevel = 'organization' | 'branch' | 'fiscalYear';

export type PermissionDomainKey = 'management' | 'trading' | 'accounting' | 'gst';

export type PermissionDomainDef = Readonly<{
  key: PermissionDomainKey;
  label: string;
  subtitle: string;
  scope: PermissionScopeLevel;
  groupKeys: readonly string[];
}>;

export const PERMISSION_DOMAINS: readonly PermissionDomainDef[] = [
  {
    key: 'management',
    label: 'Management',
    subtitle: 'Organization and access setup',
    scope: 'organization',
    groupKeys: ['user', 'branch'],
  },
  {
    key: 'management',
    label: 'Management',
    subtitle: 'Organization and access setup',
    scope: 'branch',
    groupKeys: ['fiscalYear'],
  },
  {
    key: 'trading',
    label: 'Trading',
    subtitle: 'Sales and purchase operations',
    scope: 'branch',
    groupKeys: [
      'item',
      'itemCategory',
      'tax',
      'taxGroup',
      'customer',
      'vendor',
      'purchaseInvoice',
      'saleInvoice',
      'purchaseReturn',
      'customerReceipt',
      'vendorPayment',
      'bankCash',
      'contraTransaction',
      'inventoryReports',
    ],
  },
  {
    key: 'accounting',
    label: 'Accounting',
    subtitle: 'Financial books and reports',
    scope: 'fiscalYear',
    groupKeys: [
      'journal',
      'ledger',
      'ledgerCategory',
      'accountingReports',
      'inventoryLedgerMap',
      'bankTxn',
      'bankTxnReconciliation',
      'saleInvoiceReconciliation',
      'purchaseInvoiceReconciliation',
      'customerReceiptReconciliation',
      'vendorPaymentReconciliation',
      'contraTransactionReconciliation',
    ],
  },
  {
    key: 'gst',
    label: 'GST',
    subtitle: 'GST compliance',
    scope: 'fiscalYear',
    groupKeys: ['gstReconciliation'],
  },
] as const;

export function getDomainsForScope(scope: PermissionScopeLevel): readonly PermissionDomainDef[] {
  return PERMISSION_DOMAINS.filter((domain) => domain.scope === scope);
}

export function getGroupsForScope(scope: PermissionScopeLevel): readonly PermissionGroupDef[] {
  switch (scope) {
    case 'organization':
      return ORGANIZATION_PERMISSION_GROUPS;
    case 'branch':
      return BRANCH_PERMISSION_GROUPS;
    case 'fiscalYear':
      return FISCAL_YEAR_PERMISSION_GROUPS;
  }
}

export function getGroupsForDomain(
  domain: PermissionDomainDef,
  allGroups?: readonly PermissionGroupDef[],
): readonly PermissionGroupDef[] {
  const groups = allGroups ?? getGroupsForScope(domain.scope);
  const groupByKey = new Map(groups.map((group) => [group.key, group]));
  return domain.groupKeys
    .map((key) => groupByKey.get(key))
    .filter((group): group is PermissionGroupDef => Boolean(group));
}

export function getDomainActionKeys(
  domain: PermissionDomainDef,
  allGroups?: readonly PermissionGroupDef[],
): readonly string[] {
  return getGroupActionKeys(getGroupsForDomain(domain, allGroups));
}

export function getDomainGroupEntries(
  domain: PermissionDomainDef,
  allGroups?: readonly PermissionGroupDef[],
): readonly { group: PermissionGroupDef; actionKeys: readonly string[] }[] {
  return getGroupsForDomain(domain, allGroups).map((group) => ({
    group,
    actionKeys: group.actions.map((entry) => entry.key),
  }));
}
