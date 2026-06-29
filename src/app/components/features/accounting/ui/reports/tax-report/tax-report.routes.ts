import type { Routes } from '@angular/router';

export const taxReportRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tax-report.component').then((m) => m.TaxReportComponent),
  },
];
