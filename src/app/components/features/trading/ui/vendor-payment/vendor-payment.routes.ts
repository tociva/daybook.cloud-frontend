import { Routes } from '@angular/router';

export const vendorPaymentRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-vendor-payment/list-vendor-payment.component').then(
        (m) => m.ListVendorPaymentComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-vendor-payment/create-vendor-payment.component').then(
        (m) => m.CreateVendorPaymentComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-vendor-payment/view-vendor-payment.component').then(
        (m) => m.ViewVendorPaymentComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-vendor-payment/create-vendor-payment.component').then(
        (m) => m.CreateVendorPaymentComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-vendor-payment/delete-vendor-payment.component').then(
        (m) => m.DeleteVendorPaymentComponent,
      ),
  },
];
