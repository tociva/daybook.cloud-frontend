import type { Routes } from '@angular/router';

export const ledgerCategoryReportRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ledger-category-report.component').then((m) => m.LedgerCategoryReportComponent),
  },
  {
    path: ':ledgercategoryid',
    loadComponent: () =>
      import('./ledger-category-report.component').then((m) => m.LedgerCategoryReportComponent),
  },
];
