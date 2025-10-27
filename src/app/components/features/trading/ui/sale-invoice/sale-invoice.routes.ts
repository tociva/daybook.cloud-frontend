import { Routes } from '@angular/router';

export const saleInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-sale-invoice/list-sale-invoice').then(m => m.ListSaleInvoice),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/invoice-shell/invoice-shell').then(m => m.InvoiceShell),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create/invoice-shell/invoice-shell').then(m => m.InvoiceShell),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create/invoice-shell/invoice-shell').then(m => m.InvoiceShell),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./create/invoice-shell/invoice-shell').then(m => m.InvoiceShell),
  },
];
