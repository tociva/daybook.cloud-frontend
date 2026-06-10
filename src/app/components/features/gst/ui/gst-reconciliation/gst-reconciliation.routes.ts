import { Routes } from '@angular/router';

export const gstReconciliationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./gst-reconciliation.component').then((m) => m.GstReconciliationComponent),
  },
  {
    path: 'detail/gstr1/:month',
    loadComponent: () =>
      import('./gstr1-monthly-detail/gstr1-reconciliation-monthly-detail.component').then(
        (m) => m.Gstr1ReconciliationMonthlyDetailComponent,
      ),
  },
  {
    path: 'detail/gstr2b/:month',
    loadComponent: () =>
      import('./gstr2b-monthly-detail/gstr2b-reconciliation-monthly-detail.component').then(
        (m) => m.Gstr2bReconciliationMonthlyDetailComponent,
      ),
  },
];
