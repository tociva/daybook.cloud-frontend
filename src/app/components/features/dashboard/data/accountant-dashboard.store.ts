import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { getApiErrorMessage } from '../../../../core/api/api-error.util';
import { AccountantDashboardService } from './accountant-dashboard.service';
import { initialAccountantDashboardState } from './accountant-dashboard.state';

export const AccountantDashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialAccountantDashboardState),
  withComputed(({ accountantDashboard }) => ({
    error: computed(() => accountantDashboard().error),
    isLoading: computed(() => accountantDashboard().isLoading),
    loadedAt: computed(() => accountantDashboard().loadedAt),
    summary: computed(() => accountantDashboard().summary),
  })),
  withMethods((store, service = inject(AccountantDashboardService)) => ({
    clearError(): void {
      patchState(store, (state) => ({
        accountantDashboard: {
          ...state.accountantDashboard,
          error: null,
        },
      }));
    },

    async loadSummary(): Promise<void> {
      patchState(store, (state) => ({
        accountantDashboard: {
          ...state.accountantDashboard,
          error: null,
          isLoading: true,
          summary: null,
        },
      }));

      try {
        const summary = await service.loadSummary();
        patchState(store, {
          accountantDashboard: {
            error: null,
            isLoading: false,
            loadedAt: new Date().toISOString(),
            summary,
          },
        });
      } catch (error) {
        patchState(store, (state) => ({
          accountantDashboard: {
            ...state.accountantDashboard,
            error: getApiErrorMessage(error, 'Failed to load accountant dashboard.'),
            isLoading: false,
          },
        }));
      }
    },
  })),
);

