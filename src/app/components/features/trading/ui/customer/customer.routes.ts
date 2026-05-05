import { Routes } from '@angular/router';

export const customerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-customer/list-customer.component').then((m) => m.ListCustomerComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-customer/create-customer.component').then((m) => m.CreateCustomerComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-customer/view-customer.component').then((m) => m.ViewCustomerComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-customer/create-customer.component').then((m) => m.CreateCustomerComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-customer/delete-customer.component').then((m) => m.DeleteCustomerComponent),
  },
];
