export type PermissionFlags = Readonly<Record<string, boolean>>;

export type FiscalYearScopePermissions = Readonly<{
  journal: PermissionFlags;
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
  saleInvoice: PermissionFlags;
  purchaseReturn: PermissionFlags;
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
  branches: Readonly<Record<string, BranchScopePermissions>>;
}>;

export type OrganizationMemberPermissionTree = Readonly<{
  organizations: Readonly<Record<string, OrganizationScopePermissions>>;
}>;
