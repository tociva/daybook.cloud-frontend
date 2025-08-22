import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-customer/list-customer').then(m => m.ListCustomer),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-customer/create-customer').then(m => m.CreateCustomer),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-customer/create-customer').then(m => m.CreateCustomer),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-customer/create-customer').then(m => m.CreateCustomer),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-customer/delete-customer').then(m => m.DeleteCustomer),
  },
];
