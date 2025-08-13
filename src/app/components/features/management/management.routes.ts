import { Routes } from '@angular/router';

export const managementRoutes: Routes = [
  {
    path: 'organization',
    loadChildren: () => import('./ui/organization/organization.route').then(m => m.organizationRoutes),
  },
];
