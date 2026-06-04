import type { Routes } from '@angular/router';

export const ledgerReportRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ledger-report.component').then((m) => m.LedgerReportComponent),
  },
  {
    path: ':ledgerid',
    loadComponent: () =>
      import('./ledger-report.component').then((m) => m.LedgerReportComponent),
  },
];
