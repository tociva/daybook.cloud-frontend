import { Routes } from '@angular/router';

export const organizationRoutes: Routes = [
  {
    path: 'create',
    loadComponent: () => import('./create-organization/create-organization').then(m => m.CreateOrganization),  
  },
  {
    path: '',
    loadComponent: () => import('./list-organization/list-organization').then(m => m.ListOrganization),  
  },
];
