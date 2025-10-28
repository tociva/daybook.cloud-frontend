import { Routes } from '@angular/router';

export const saleInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-sale-invoice/list-sale-invoice').then(m => m.ListSaleInvoice),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/sale-invoice-shell/sale-invoice-shell').then(m => m.SaleInvoiceShell),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create/sale-invoice-shell/sale-invoice-shell').then(m => m.SaleInvoiceShell),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create/sale-invoice-shell/sale-invoice-shell').then(m => m.SaleInvoiceShell),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./create/sale-invoice-shell/sale-invoice-shell').then(m => m.SaleInvoiceShell),
  },
];
