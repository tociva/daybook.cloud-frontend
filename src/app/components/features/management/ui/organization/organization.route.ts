import { Routes } from '@angular/router';

export const organizationRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create-organization/create-organization.component').then(m => m.CreateOrganizationComponent),  
  },
  {
    path: '',
    loadComponent: () => import('./list-organization/list-organization.component').then(m => m.ListOrganizationComponent),  
  },
];
