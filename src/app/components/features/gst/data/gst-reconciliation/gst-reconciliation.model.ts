export type GstReturnType = 'gstr1' | 'gstr2b';

export type GstReconciliationReturnType = GstReturnType;

export type GstSourceFormat = 'json' | 'xlsx';

export type GstComputedStatus = 'upcoming' | 'matched' | 'partial' | 'notMatched';

export type GstReconciliationStatus =
  | 'pending'
  | 'upcoming'
  | 'inProgress'
  | 'matched'
  | 'partialMatch'
  | 'noMatch';

export type GstMonthStatus = GstReconciliationStatus;

export type GstItcEligibility = 'eligible' | 'ineligible' | 'partial' | 'unknown';

// ── Upload / refresh ──────────────────────────────────────────────────────────

export type GstReconciliationUploadUrlPayload = Readonly<{
  returnType: GstReconciliationReturnType;
  month: number;
}>;

export type GstReconciliationUploadUrlResponse = Readonly<{
  id: string;
  documentid: string;
  putUrl: string;
  returnType: GstReconciliationReturnType;
  sourceFormat: GstSourceFormat;
  month: number;
  fiscalyearid?: string;
  path?: string;
  status?: GstReconciliationStatus;
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
  status: GstMonthStatus;
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
  currencycode?: string;
  currency?: Readonly<{ code?: string }>;
  cprops?: Readonly<{
    fx?: number;
    lamt?: number;
    [key: string]: unknown;
  }>;
  conversionrate?: number | string;
  exchangeRate?: number | string;
  convertedTaxableValue?: number;
  convertedTotalTax?: number;
  convertedInvoiceValue?: number;
  exportType?: string;
  invoiceType?: string;
  gstInvoiceType?: string;
  supplyType?: string;
  type?: string;
  taxableValue?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  totalTax?: number;
  invoiceValue?: number;
  [key: string]: unknown;
}>;

export type GstReconciliationDetailRow = Readonly<{
  status?: GstReconciliationStatus;
  computedStatus?: GstComputedStatus;
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
