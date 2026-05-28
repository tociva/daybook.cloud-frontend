import type { Routes } from '@angular/router';

export const trialBalanceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./trial-balance.component').then((m) => m.TrialBalanceComponent),
  },
];
