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

export type AccountantDashboardAmountActionKey = Exclude<
  AccountantDashboardActionKey,
  AccountantDashboardComplianceActionKey | 'bankTransactions.pendingReconciliation'
>;

export type AccountantDashboardBankReconciliationActionKey = Extract<
  AccountantDashboardActionKey,
  'bankTransactions.pendingReconciliation'
>;

export type AccountantDashboardComplianceMetric<
  TActionKey extends AccountantDashboardComplianceActionKey =
    AccountantDashboardComplianceActionKey,
> = Readonly<{
  actionKey: TActionKey;
  greenMonths: number;
  notStartedMonths: number;
  partialMonths: number;
}>;

export type AccountantDashboardAmountMetric<
  TActionKey extends AccountantDashboardAmountActionKey =
    AccountantDashboardAmountActionKey,
> = Readonly<{
  actionKey: TActionKey;
  amount: number;
  count: number;
  oldestDate: string | null;
}>;

export type AccountantDashboardBankReconciliationMetric = Readonly<{
  actionKey: AccountantDashboardBankReconciliationActionKey;
  count: number;
  creditAmount: number;
  debitAmount: number;
  oldestDate: string | null;
}>;

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
    payments: AccountantDashboardAmountMetric<'payments.pendingAllocation'>;
    receipts: AccountantDashboardAmountMetric<'receipts.pendingAllocation'>;
  }>;
  pendingJournals: Readonly<{
    payments: AccountantDashboardAmountMetric<'payments.pendingJournal'>;
    purchaseInvoices: AccountantDashboardAmountMetric<'purchaseInvoices.pendingJournal'>;
    receipts: AccountantDashboardAmountMetric<'receipts.pendingJournal'>;
    saleInvoices: AccountantDashboardAmountMetric<'saleInvoices.pendingJournal'>;
  }>;
  pendingReconciliation: Readonly<{
    bankTransactions: AccountantDashboardBankReconciliationMetric;
  }>;
}>;

