import { Routes } from '@angular/router';

export const purchaseInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-purchase-invoice/list-purchase-invoice').then(m => m.ListPurchaseInvoice),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/purchase-invoice-shell/purchase-invoice-shell').then(m => m.PurchaseInvoiceShell),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create/purchase-invoice-shell/purchase-invoice-shell').then(m => m.PurchaseInvoiceShell),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create/purchase-invoice-shell/purchase-invoice-shell').then(m => m.PurchaseInvoiceShell),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./create/purchase-invoice-shell/purchase-invoice-shell').then(m => m.PurchaseInvoiceShell),
  },
];

