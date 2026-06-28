export type PermissionFlags = Readonly<Record<string, boolean>>;

export type FiscalYearScopePermissions = Readonly<{
  journal: PermissionFlags;
  journalDocument: PermissionFlags;
  ledger: PermissionFlags;
  ledgerCategory: PermissionFlags;
  accountingReports: PermissionFlags;
  inventoryLedgerMap: PermissionFlags;
  bankTxn: PermissionFlags;
  bankTxnReconciliation: PermissionFlags;
  saleInvoiceReconciliation: PermissionFlags;
  purchaseInvoiceReconciliation: PermissionFlags;
  customerReceiptReconciliation: PermissionFlags;
  vendorPaymentReconciliation: PermissionFlags;
  contraTransactionReconciliation: PermissionFlags;
  gstReconciliation: PermissionFlags;
  gstReconciliationDocument: PermissionFlags;
}>;

export type BranchScopePermissions = Readonly<{
  fiscalYear: PermissionFlags;
  item: PermissionFlags;
  itemCategory: PermissionFlags;
  tax: PermissionFlags;
  taxGroup: PermissionFlags;
  customer: PermissionFlags;
  vendor: PermissionFlags;
  purchaseInvoice: PermissionFlags;
  purchaseInvoiceDocument: PermissionFlags;
  saleInvoice: PermissionFlags;
  saleInvoiceDocument: PermissionFlags;
  purchaseReturn: PermissionFlags;
  purchaseReturnDocument: PermissionFlags;
  saleInvoiceTemplateDocument: PermissionFlags;
  customerReceipt: PermissionFlags;
  vendorPayment: PermissionFlags;
  bankCash: PermissionFlags;
  contraTransaction: PermissionFlags;
  inventoryReports: PermissionFlags;
  fiscalyears: Readonly<Record<string, FiscalYearScopePermissions>>;
}>;

export type OrganizationScopePermissions = Readonly<{
  user: PermissionFlags;
  branch: PermissionFlags;
  organizationDocument: PermissionFlags;
  organizationLogoDocument: PermissionFlags;
  branches: Readonly<Record<string, BranchScopePermissions>>;
}>;

export type OrganizationMemberPermissionTree = Readonly<{
  organization?: PermissionFlags;
  organizations: Readonly<Record<string, OrganizationScopePermissions>>;
  userSubscription?: PermissionFlags;
}>;

export type SparsePermissionNode = {
  readonly [key: string]: true | SparsePermissionNode;
};

export type SparseOrganizationMemberPermissionTree = Readonly<{
  organization?: SparsePermissionNode;
  organizations?: SparsePermissionNode;
  userSubscription?: SparsePermissionNode;
}>;
