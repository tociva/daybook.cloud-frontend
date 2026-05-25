import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../core/api/api-error.util';
import type {
  GstReconciliationRefreshPayload,
  GstReconciliationReturnType,
  GstReconciliationUploadUrlPayload,
} from './gst-reconciliation.model';
import { GstReconciliationService } from './gst-reconciliation.service';
import { initialGstReconciliationState } from './gst-reconciliation.state';

export const GstReconciliationStore = signalStore(
  { providedIn: 'root' },
  withState(initialGstReconciliationState),
  withComputed(({ gstReconciliation }) => ({
    detail:           computed(() => gstReconciliation().detail),
    error:            computed(() => gstReconciliation().error),
    isLoadingDetail:  computed(() => gstReconciliation().isLoadingDetail),
    isLoadingSummary: computed(() => gstReconciliation().isLoadingSummary),
    isRefreshing:     computed(() => gstReconciliation().isRefreshing),
    isUploading:      computed(() => gstReconciliation().isUploading),
    refreshResult:    computed(() => gstReconciliation().refreshResult),
    summary:          computed(() => gstReconciliation().summary),

    /** True while any async write operation is in flight. */
    isBusy: computed(
      () => gstReconciliation().isUploading || gstReconciliation().isRefreshing,
    ),
  })),
  withMethods((store, service = inject(GstReconciliationService)) => ({
    clearDetail(): void {
      patchState(store, (s) => ({
        gstReconciliation: { ...s.gstReconciliation, detail: null },
      }));
    },

    clearError(): void {
      patchState(store, (s) => ({
        gstReconciliation: { ...s.gstReconciliation, error: null },
      }));
    },

    clearRefreshResult(): void {
      patchState(store, (s) => ({
        gstReconciliation: { ...s.gstReconciliation, refreshResult: null },
      }));
    },

    /**
     * Trigger a reconciliation refresh without uploading a file.
     * Returns true on success, false on error.
     */
    async refresh(payload: GstReconciliationRefreshPayload): Promise<boolean> {
      patchState(store, (s) => ({
        gstReconciliation: {
          ...s.gstReconciliation,
          error: null,
          isRefreshing: true,
          refreshResult: null,
        },
      }));

      try {
        const refreshResult = await service.refresh(payload);
        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: null,
            isRefreshing: false,
            refreshResult,
          },
        }));
        return true;
      } catch (error) {
        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to refresh GST reconciliation.'),
            isRefreshing: false,
          },
        }));
        return false;
      }
    },

    /**
     * Three-step upload flow:
     *  1. POST /gst-reconciliation/upload-url  → get signed URL
     *  2. PUT file to signed URL
     *  3. POST /gst-reconciliation/refresh     → trigger reconciliation
     *
     * Returns true on full success, false if any step fails.
     */
    async uploadAndRefresh(
      payload: GstReconciliationUploadUrlPayload & { file: File },
    ): Promise<boolean> {
      patchState(store, (s) => ({
        gstReconciliation: {
          ...s.gstReconciliation,
          error: null,
          isUploading: true,
          refreshResult: null,
        },
      }));

      try {
        // Step 1 – obtain signed upload URL
        const { putUrl } = await service.createUploadUrl({
          returnType: payload.returnType,
          month: payload.month,
        });
        if (!putUrl) {
          throw new Error('Upload URL response did not include putUrl.');
        }

        // Step 2 – stream file directly to storage
        await service.uploadFileToSignedUrl(putUrl, payload.file);

        patchState(store, (s) => ({
          gstReconciliation: { ...s.gstReconciliation, isUploading: false, isRefreshing: true },
        }));

        // Step 3 – trigger reconciliation
        const refreshPayload: GstReconciliationRefreshPayload = {
          returnType: payload.returnType,
          month: payload.month,
        };
        const refreshResult = await service.refresh(refreshPayload);

        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: null,
            isRefreshing: false,
            refreshResult,
          },
        }));
        return true;
      } catch (error) {
        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to upload and refresh GST reconciliation.'),
            isRefreshing: false,
            isUploading: false,
          },
        }));
        return false;
      }
    },

    async loadSummary(): Promise<void> {
      patchState(store, (s) => ({
        gstReconciliation: { ...s.gstReconciliation, error: null, isLoadingSummary: true },
      }));

      try {
        const summary = await service.loadSummary();
        patchState(store, (s) => ({
          gstReconciliation: { ...s.gstReconciliation, error: null, isLoadingSummary: false, summary },
        }));
      } catch (error) {
        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to load GST reconciliation summary.'),
            isLoadingSummary: false,
          },
        }));
      }
    },

    async loadDetail(
      returnType: GstReconciliationReturnType,
      month: number,
    ): Promise<void> {
      patchState(store, (s) => ({
        gstReconciliation: {
          ...s.gstReconciliation,
          detail: null,
          error: null,
          isLoadingDetail: true,
        },
      }));

      try {
        const detail = await service.loadDetail(returnType, month);
        patchState(store, (s) => ({
          gstReconciliation: { ...s.gstReconciliation, detail, error: null, isLoadingDetail: false },
        }));
      } catch (error) {
        patchState(store, (s) => ({
          gstReconciliation: {
            ...s.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to load GST reconciliation detail.'),
            isLoadingDetail: false,
          },
        }));
      }
    },
  })),
);

// Re-export types so UI components can import from a single path.
export type {
  GstComputedStatus,
  GstItcEligibility,
  GstMonthStatus,
  GstReconciliationDetailRow,
  GstReconciliationDetailSummary,
  GstReconciliationInvoice,
  GstReconciliationMonthSummary,
  GstReconciliationPartyGroup,
  GstReconciliationRefreshPayload,
  GstReconciliationRefreshResponse,
  GstReconciliationReturnType,
  GstReconciliationStatus,
  GstReconciliationSummaryResponse,
  GstReconciliationUploadUrlPayload,
  GstReturnType,
  GstSourceFormat,
} from './gst-reconciliation.model';
