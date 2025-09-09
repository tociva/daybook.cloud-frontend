import { Routes } from '@angular/router';

export const ledgerRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-ledger/list-ledger').then(m => m.ListLedger),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-ledger/create-ledger').then(m => m.CreateLedger),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-ledger/create-ledger').then(m => m.CreateLedger),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-ledger/create-ledger').then(m => m.CreateLedger),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-ledger/delete-ledger').then(m => m.DeleteLedger),
  },
];
