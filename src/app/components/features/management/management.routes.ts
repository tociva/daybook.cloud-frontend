import { Routes } from '@angular/router';

export const managementRoutes: Routes = [
  {
    path: 'organization',
    loadChildren: () => import('./ui/organization/organization.route').then(m => m.organizationRoutes),
  },
  {
    path: 'branch',
    loadChildren: () => import('./ui/branch/branch.route').then(m => m.branchRoutes),
  },
  {
    path: 'fiscal-year',
    loadChildren: () => import('./ui/fiscal-year/fiscal-year.route').then(m => m.fiscalYearRoutes),
  },
];
