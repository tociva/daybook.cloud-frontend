import type { Routes } from '@angular/router';

export const profitLossRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./profit-loss.component').then((m) => m.ProfitLossComponent),
  },
];
