import { Routes } from '@angular/router';

export const taxGroupRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-tax-group/list-tax-group').then(m => m.ListTaxGroup),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-tax-group/create-tax-group').then(m => m.CreateTaxGroup),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-tax-group/create-tax-group').then(m => m.CreateTaxGroup),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-tax-group/create-tax-group').then(m => m.CreateTaxGroup),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-tax-group/delete-tax-group').then(m => m.DeleteTaxGroup),
  },
];
