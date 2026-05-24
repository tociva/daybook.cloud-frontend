import { Routes } from '@angular/router';

export const gstReconciliationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./gst-reconciliation.component').then((m) => m.GstReconciliationComponent),
  },
  {
    path: 'detail/:returnType/:month',
    loadComponent: () =>
      import('./monthly-detail/gst-reconciliation-monthly-detail.component').then(
        (m) => m.GstReconciliationMonthlyDetailComponent,
      ),
  },
];
