import { Routes } from '@angular/router';

export const taxRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-tax/list-tax.component').then((m) => m.ListTaxComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-tax/create-tax.component').then((m) => m.CreateTaxComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./view-tax/view-tax.component').then((m) => m.ViewTaxComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-tax/create-tax.component').then((m) => m.CreateTaxComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-tax/delete-tax.component').then((m) => m.DeleteTaxComponent),
  },
];

