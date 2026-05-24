import type {
  GstReconciliationDetailResponse,
  GstReconciliationImportResponse,
  GstReconciliationSummaryResponse,
} from './gst-reconciliation.model';

export type GstReconciliationState = {
  detail: GstReconciliationDetailResponse | null;
  error: string | null;
  importResult: GstReconciliationImportResponse | null;
  isImporting: boolean;
  isLoadingDetail: boolean;
  isLoadingSummary: boolean;
  summary: GstReconciliationSummaryResponse | null;
};

export const initialGstReconciliationState: {
  gstReconciliation: GstReconciliationState;
} = {
  gstReconciliation: {
    detail: null,
    error: null,
    importResult: null,
    isImporting: false,
    isLoadingDetail: false,
    isLoadingSummary: false,
    summary: null,
  },
};
