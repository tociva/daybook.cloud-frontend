import type { Routes } from '@angular/router';

export const accountingReportsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./accounting-reports.component').then((m) => m.AccountingReportsComponent),
  },
];
