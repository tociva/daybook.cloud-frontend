import { Routes } from '@angular/router';

export const saleInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-sale-invoice/list-sale-invoice.component').then(
        (m) => m.ListSaleInvoiceComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-sale-invoice/create-sale-invoice.component').then(
        (m) => m.CreateSaleInvoiceComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-sale-invoice/view-sale-invoice.component').then(
        (m) => m.ViewSaleInvoiceComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-sale-invoice/create-sale-invoice.component').then(
        (m) => m.CreateSaleInvoiceComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-sale-invoice/delete-sale-invoice.component').then(
        (m) => m.DeleteSaleInvoiceComponent,
      ),
  },
];
