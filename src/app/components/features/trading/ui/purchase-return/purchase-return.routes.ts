import { Routes } from '@angular/router';

export const purchaseReturnRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-purchase-return/list-purchase-return.component').then(
        (m) => m.ListPurchaseReturnComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-purchase-return/create-purchase-return.component').then(
        (m) => m.CreatePurchaseReturnComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-purchase-return/view-purchase-return.component').then(
        (m) => m.ViewPurchaseReturnComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-purchase-return/create-purchase-return.component').then(
        (m) => m.CreatePurchaseReturnComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-purchase-return/delete-purchase-return.component').then(
        (m) => m.DeletePurchaseReturnComponent,
      ),
  },
];
