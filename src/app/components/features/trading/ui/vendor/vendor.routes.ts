import { Routes } from '@angular/router';

export const vendorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-vendor/list-vendor.component').then((m) => m.ListVendorComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-vendor/create-vendor.component').then((m) => m.CreateVendorComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-vendor/view-vendor.component').then((m) => m.ViewVendorComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-vendor/create-vendor.component').then((m) => m.CreateVendorComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-vendor/delete-vendor.component').then((m) => m.DeleteVendorComponent),
  },
];
