import { Routes } from '@angular/router';

export const customerReceiptRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-customer-receipt/list-customer-receipt.component').then(
        (m) => m.ListCustomerReceiptComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-customer-receipt/create-customer-receipt.component').then(
        (m) => m.CreateCustomerReceiptComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-customer-receipt/view-customer-receipt.component').then(
        (m) => m.ViewCustomerReceiptComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-customer-receipt/create-customer-receipt.component').then(
        (m) => m.CreateCustomerReceiptComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-customer-receipt/delete-customer-receipt.component').then(
        (m) => m.DeleteCustomerReceiptComponent,
      ),
  },
];
