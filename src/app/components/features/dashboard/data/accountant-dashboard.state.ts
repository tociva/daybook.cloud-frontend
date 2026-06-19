import type { AccountantDashboardSummary } from './accountant-dashboard.model';

export type AccountantDashboardStateModel = Readonly<{
  error: string | null;
  isLoading: boolean;
  loadedAt: string | null;
  summary: AccountantDashboardSummary | null;
}>;

export type AccountantDashboardFeatureState = Readonly<{
  accountantDashboard: AccountantDashboardStateModel;
}>;

export const initialAccountantDashboardState: AccountantDashboardFeatureState = {
  accountantDashboard: {
    error: null,
    isLoading: false,
    loadedAt: null,
    summary: null,
  },
};

