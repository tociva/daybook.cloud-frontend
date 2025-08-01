import { Routes } from '@angular/router';

export const managementRoutes: Routes = [
  {
    path: 'organization',
    loadChildren: () => import('./organization/organization.route').then(m => m.organizationRoutes),
  },
];
