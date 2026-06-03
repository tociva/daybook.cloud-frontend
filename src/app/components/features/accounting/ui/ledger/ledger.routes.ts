import { Routes } from '@angular/router';

export const ledgerRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-ledger/list-ledger.component').then((m) => m.ListLedgerComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-ledger/create-ledger.component').then((m) => m.CreateLedgerComponent),
  },
  {
    path: 'tree-view',
    loadComponent: () =>
      import('./tree-view-ledger/tree-view-ledger.component').then(
        (m) => m.TreeViewLedgerComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-ledger/view-ledger.component').then((m) => m.ViewLedgerComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-ledger/create-ledger.component').then((m) => m.CreateLedgerComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-ledger/delete-ledger.component').then((m) => m.DeleteLedgerComponent),
  },
];
