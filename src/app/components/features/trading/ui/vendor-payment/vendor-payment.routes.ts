import { Routes } from '@angular/router';

export const vendorPaymentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-vendor-payment/list-vendor-payment').then(m => m.ListVendorPayment),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-vendor-payment/create-vendor-payment').then(m => m.CreateVendorPayment),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-vendor-payment/create-vendor-payment').then(m => m.CreateVendorPayment),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-vendor-payment/create-vendor-payment').then(m => m.CreateVendorPayment),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-vendor-payment/delete-vendor-payment').then(m => m.DeleteVendorPayment),
  },
];

