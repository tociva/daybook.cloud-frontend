import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import type {
  GstReconciliationImportPayload,
  GstReconciliationQuery,
  GstReconciliationReturnType,
  GstReconciliationSummaryQuery,
} from './gst-reconciliation.model';
import { GstReconciliationService } from './gst-reconciliation.service';
import { initialGstReconciliationState } from './gst-reconciliation.state';

export const GstReconciliationStore = signalStore(
  { providedIn: 'root' },
  withState(initialGstReconciliationState),
  withComputed(({ gstReconciliation }) => ({
    detail: computed(() => gstReconciliation().detail),
    error: computed(() => gstReconciliation().error),
    importResult: computed(() => gstReconciliation().importResult),
    isImporting: computed(() => gstReconciliation().isImporting),
    isLoadingDetail: computed(() => gstReconciliation().isLoadingDetail),
    isLoadingSummary: computed(() => gstReconciliation().isLoadingSummary),
    summary: computed(() => gstReconciliation().summary),
  })),
  withMethods((store, service = inject(GstReconciliationService)) => ({
    clearDetail(): void {
      patchState(store, (state) => ({
        gstReconciliation: { ...state.gstReconciliation, detail: null },
      }));
    },

    clearError(): void {
      patchState(store, (state) => ({
        gstReconciliation: { ...state.gstReconciliation, error: null },
      }));
    },

    clearImportResult(): void {
      patchState(store, (state) => ({
        gstReconciliation: { ...state.gstReconciliation, importResult: null },
      }));
    },

    async importUploadedFile(payload: GstReconciliationImportPayload): Promise<boolean> {
      patchState(store, (state) => ({
        gstReconciliation: {
          ...state.gstReconciliation,
          error: null,
          importResult: null,
          isImporting: true,
        },
      }));

      try {
        const importResult = await service.importUploadedFile(payload);
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            error: null,
            importResult,
            isImporting: false,
          },
        }));
        return true;
      } catch (error) {
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to import GST reconciliation file.'),
            isImporting: false,
          },
        }));
        return false;
      }
    },

    async loadSummary(query: GstReconciliationSummaryQuery): Promise<void> {
      patchState(store, (state) => ({
        gstReconciliation: {
          ...state.gstReconciliation,
          error: null,
          isLoadingSummary: true,
        },
      }));

      try {
        const summary = await service.loadSummary(query);
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            error: null,
            isLoadingSummary: false,
            summary,
          },
        }));
      } catch (error) {
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to load GST reconciliation summary.'),
            isLoadingSummary: false,
          },
        }));
      }
    },

    async loadDetail(
      returnType: GstReconciliationReturnType,
      month: number,
      query: GstReconciliationQuery,
    ): Promise<void> {
      patchState(store, (state) => ({
        gstReconciliation: {
          ...state.gstReconciliation,
          detail: null,
          error: null,
          isLoadingDetail: true,
        },
      }));

      try {
        const detail = await service.loadDetail(returnType, month, query);
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            detail,
            error: null,
            isLoadingDetail: false,
          },
        }));
      } catch (error) {
        patchState(store, (state) => ({
          gstReconciliation: {
            ...state.gstReconciliation,
            error: getApiErrorMessage(error, 'Failed to load GST reconciliation detail.'),
            isLoadingDetail: false,
          },
        }));
      }
    },
  })),
);
