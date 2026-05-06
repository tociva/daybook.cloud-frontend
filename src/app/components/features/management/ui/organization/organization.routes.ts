import { Routes } from '@angular/router';

export const organizationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-organization/list-organization.component').then(
        (m) => m.ListOrganizationComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-organization/create-organization.component').then(
        (m) => m.CreateOrganizationComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-organization/view-organization.component').then(
        (m) => m.ViewOrganizationComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-organization/create-organization.component').then(
        (m) => m.CreateOrganizationComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-organization/delete-organization.component').then(
        (m) => m.DeleteOrganizationComponent,
      ),
  },
];
