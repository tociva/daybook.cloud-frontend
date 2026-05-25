export type GstReconciliationReturnType = 'gstr1' | 'gstr2b';

export type GstReconciliationStatus = 'upcoming' | 'pending' | 'matched' | 'partial' | 'notMatched';

// ── Upload / refresh ──────────────────────────────────────────────────────────

export type GstReconciliationUploadUrlPayload = Readonly<{
  returnType: GstReconciliationReturnType;
  month: number;
}>;

export type GstReconciliationUploadUrlResponse = Readonly<{
  uploadUrl: string;
  /** Additional fields the backend may return (e.g. key, expiry). */
  [key: string]: unknown;
}>;

export type GstReconciliationRefreshPayload = Readonly<{
  returnType: GstReconciliationReturnType;
  month: number;
}>;

export type GstReconciliationRefreshResponse = Readonly<Record<string, unknown>>;

// ── Summary ───────────────────────────────────────────────────────────────────

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

// ── Detail ────────────────────────────────────────────────────────────────────

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
