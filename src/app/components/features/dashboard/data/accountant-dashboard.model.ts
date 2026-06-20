export type AccountantDashboardActionKey =
  | 'bankTransactions.pendingReconciliation'
  | 'gst.gstr1'
  | 'gst.gstr2b'
  | 'payments.pendingAllocation'
  | 'payments.pendingJournal'
  | 'purchaseInvoices.pendingJournal'
  | 'receipts.pendingAllocation'
  | 'receipts.pendingJournal'
  | 'saleInvoices.pendingJournal';

export type AccountantDashboardComplianceActionKey = Extract<
  AccountantDashboardActionKey,
  'gst.gstr1' | 'gst.gstr2b'
>;

export type AccountantDashboardSummaryQuery = Readonly<{
  asOfDate?: string;
  branchid?: string;
  fiscalyearid?: string;
}>;

export type AccountantDashboardMetric<
  TActionKey extends AccountantDashboardActionKey = AccountantDashboardActionKey,
> = Readonly<{
  actionKey: TActionKey;
  pendingCount: number;
  totalCount: number;
}>;

export type AccountantDashboardComplianceMetric<
  TActionKey extends AccountantDashboardComplianceActionKey =
    AccountantDashboardComplianceActionKey,
> = AccountantDashboardMetric<TActionKey>;

export type AccountantDashboardWorkMetric<
  TActionKey extends Exclude<AccountantDashboardActionKey, AccountantDashboardComplianceActionKey> =
    Exclude<AccountantDashboardActionKey, AccountantDashboardComplianceActionKey>,
> = AccountantDashboardMetric<TActionKey>;

export type AccountantDashboardSummary = Readonly<{
  asOfDate: string;
  branchid: string;
  compliance: Readonly<{
    gstr1: AccountantDashboardComplianceMetric<'gst.gstr1'>;
    gstr2b: AccountantDashboardComplianceMetric<'gst.gstr2b'>;
  }>;
  fiscalyearid: string;
  lastCompletedMonth: string;
  pendingAllocations: Readonly<{
    payments: AccountantDashboardWorkMetric<'payments.pendingAllocation'>;
    receipts: AccountantDashboardWorkMetric<'receipts.pendingAllocation'>;
  }>;
  pendingJournals: Readonly<{
    payments: AccountantDashboardWorkMetric<'payments.pendingJournal'>;
    purchaseInvoices: AccountantDashboardWorkMetric<'purchaseInvoices.pendingJournal'>;
    receipts: AccountantDashboardWorkMetric<'receipts.pendingJournal'>;
    saleInvoices: AccountantDashboardWorkMetric<'saleInvoices.pendingJournal'>;
  }>;
  pendingReconciliation: Readonly<{
    bankTransactions: AccountantDashboardWorkMetric<'bankTransactions.pendingReconciliation'>;
  }>;
}>;
