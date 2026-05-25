import type {
  GstReconciliationDetailResponse,
  GstReconciliationRefreshResponse,
  GstReconciliationSummaryResponse,
} from './gst-reconciliation.model';

export type GstReconciliationState = {
  detail: GstReconciliationDetailResponse | null;
  error: string | null;
  isLoadingDetail: boolean;
  isLoadingSummary: boolean;
  isRefreshing: boolean;
  isUploading: boolean;
  refreshResult: GstReconciliationRefreshResponse | null;
  summary: GstReconciliationSummaryResponse | null;
};

export const initialGstReconciliationState: {
  gstReconciliation: GstReconciliationState;
} = {
  gstReconciliation: {
    detail: null,
    error: null,
    isLoadingDetail: false,
    isLoadingSummary: false,
    isRefreshing: false,
    isUploading: false,
    refreshResult: null,
    summary: null,
  },
};
