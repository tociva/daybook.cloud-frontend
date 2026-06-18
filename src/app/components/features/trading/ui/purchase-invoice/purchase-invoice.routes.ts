import { Routes } from '@angular/router';

export const purchaseInvoiceRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-purchase-invoice/list-purchase-invoice.component').then(
        (m) => m.ListPurchaseInvoiceComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-purchase-invoice/create-purchase-invoice.component').then(
        (m) => m.CreatePurchaseInvoiceComponent,
      ),
  },
  {
    path: ':id/payments',
    loadComponent: () =>
      import('./purchase-invoice-payments/purchase-invoice-payments.component').then(
        (m) => m.PurchaseInvoicePaymentsComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-purchase-invoice/view-purchase-invoice.component').then(
        (m) => m.ViewPurchaseInvoiceComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-purchase-invoice/create-purchase-invoice.component').then(
        (m) => m.CreatePurchaseInvoiceComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-purchase-invoice/delete-purchase-invoice.component').then(
        (m) => m.DeletePurchaseInvoiceComponent,
      ),
  },
];
