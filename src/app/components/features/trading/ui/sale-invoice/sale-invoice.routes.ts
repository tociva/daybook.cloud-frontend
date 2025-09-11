import { Routes } from '@angular/router';

export const saleInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-sale-invoice/list-sale-invoice').then(m => m.ListSaleInvoice),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-sale-invoice/create-sale-invoice').then(m => m.CreateSaleInvoice),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-sale-invoice/create-sale-invoice').then(m => m.CreateSaleInvoice),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-sale-invoice/create-sale-invoice').then(m => m.CreateSaleInvoice),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-sale-invoice/delete-sale-invoice').then(m => m.DeleteSaleInvoice),
  },
];
