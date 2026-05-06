import { Routes } from '@angular/router';

export const ledgerCategoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-ledger-category/list-ledger-category.component').then(
        (m) => m.ListLedgerCategoryComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-ledger-category/create-ledger-category.component').then(
        (m) => m.CreateLedgerCategoryComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-ledger-category/view-ledger-category.component').then(
        (m) => m.ViewLedgerCategoryComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-ledger-category/create-ledger-category.component').then(
        (m) => m.CreateLedgerCategoryComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-ledger-category/delete-ledger-category.component').then(
        (m) => m.DeleteLedgerCategoryComponent,
      ),
  },
];
