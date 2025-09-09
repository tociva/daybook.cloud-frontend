import { Routes } from '@angular/router';

export const ledgerCategoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-ledger-category/list-ledger-category').then(m => m.ListLedgerCategory),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-ledger-category/create-ledger-category').then(m => m.CreateLedgerCategory),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-ledger-category/create-ledger-category').then(m => m.CreateLedgerCategory),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-ledger-category/create-ledger-category').then(m => m.CreateLedgerCategory),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-ledger-category/delete-ledger-category').then(m => m.DeleteLedgerCategory),
  },
];
