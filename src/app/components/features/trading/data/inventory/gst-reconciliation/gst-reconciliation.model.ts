export type GstReconciliationReturnType = 'gstr1' | 'gstr2b';

export type GstReconciliationSourceFormat = 'json' | 'xlsx';

export type GstReconciliationStatus = 'upcoming' | 'pending' | 'matched' | 'partial' | 'notMatched';

export type GstReconciliationImportPayload = Readonly<{
  branchid: string;
  month: number;
  returnType: GstReconciliationReturnType;
  sourceFormat: GstReconciliationSourceFormat;
  /** The uploaded return file (sent as multipart/form-data). */
  file: File;
}>;

export type GstReconciliationImportResponse = Readonly<{
  returnType: GstReconciliationReturnType;
  branchid: string;
  month: number;
  sourceFormat: GstReconciliationSourceFormat;
  savedCount: number;
}>;

export type GstReconciliationQuery = Readonly<{
  branchid: string;
}>;

export type GstReconciliationSummaryQuery = GstReconciliationQuery;

export type GstReconciliationMonthSummary = Readonly<{
  returnType: GstReconciliationReturnType;
  month: number;
  status: GstReconciliationStatus;
  gstInvoiceCount: number;
  booksInvoiceCount: number;
  matchedCount: number;
  partialCount: number;
  mismatchCount: number;
  differenceAmount: number;
}>;

export type GstReconciliationSummaryResponse = Readonly<{
  gstr1: readonly GstReconciliationMonthSummary[];
  gstr2b: readonly GstReconciliationMonthSummary[];
}>;

export type GstReconciliationInvoice = Readonly<{
  id?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  taxableValue?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  totalTax?: number;
  invoiceValue?: number;
}>;

export type GstReconciliationDetailRow = Readonly<{
  status?: GstReconciliationStatus;
  computedStatus?: GstReconciliationStatus;
  reconciliationStatus?: GstReconciliationStatus;
  partyGstin?: string;
  partyName?: string;
  reason?: string;
  booksInvoice?: GstReconciliationInvoice | null;
  gstInvoice?: GstReconciliationInvoice | null;
  differenceAmount?: number;
}>;

export type GstReconciliationPartyGroup = Readonly<{
  partyGstin?: string;
  partyName?: string;
  rows: readonly GstReconciliationDetailRow[];
}>;

export type GstReconciliationDetailSummary = Readonly<{
  matchedCount: number;
  partialCount: number;
  notMatchedCount: number;
  booksInvoiceCount: number;
  gstInvoiceCount: number;
  differenceAmount: number;
}>;

export type GstReconciliationDetailResponse = Readonly<{
  returnType: GstReconciliationReturnType;
  month: number;
  summary: GstReconciliationDetailSummary;
  groups: readonly GstReconciliationPartyGroup[];
}>;
