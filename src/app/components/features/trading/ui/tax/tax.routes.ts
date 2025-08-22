import { Routes } from '@angular/router';

export const taxRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-tax/list-tax').then(m => m.ListTax),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-tax/create-tax').then(m => m.CreateTax),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-tax/create-tax').then(m => m.CreateTax),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-tax/create-tax').then(m => m.CreateTax),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-tax/delete-tax').then(m => m.DeleteTax),
  },
];
