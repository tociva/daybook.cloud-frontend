import { Routes } from '@angular/router';

export const purchaseReturnRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-purchase-return/list-purchase-return').then(m => m.ListPurchaseReturn),
  },
  {
    path: 'create',
    loadComponent: () => import('./create/purchase-return-shell/purchase-return-shell').then(m => m.PurchaseReturnShell),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create/purchase-return-shell/purchase-return-shell').then(m => m.PurchaseReturnShell),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create/purchase-return-shell/purchase-return-shell').then(m => m.PurchaseReturnShell),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./create/purchase-return-shell/purchase-return-shell').then(m => m.PurchaseReturnShell),
  },
];

