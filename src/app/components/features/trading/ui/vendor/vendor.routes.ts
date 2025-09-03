import { Routes } from '@angular/router';

export const vendorRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-vendor/list-vendor').then(m => m.ListVendor),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-vendor/create-vendor').then(m => m.CreateVendor),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-vendor/create-vendor').then(m => m.CreateVendor),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-vendor/create-vendor').then(m => m.CreateVendor),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-vendor/delete-vendor').then(m => m.DeleteVendor),
  },
];
