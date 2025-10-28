import { Routes } from '@angular/router';

export const customerReceiptRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-customer-receipt/list-customer-receipt').then(m => m.ListCustomerReceipt),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-customer-receipt/create-customer-receipt').then(m => m.CreateCustomerReceipt),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-customer-receipt/create-customer-receipt').then(m => m.CreateCustomerReceipt),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-customer-receipt/create-customer-receipt').then(m => m.CreateCustomerReceipt),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-customer-receipt/delete-customer-receipt').then(m => m.DeleteCustomerReceipt),
  },
];

