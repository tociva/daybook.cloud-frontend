import { Routes } from '@angular/router';

export const bankingRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-bank-txn/list-bank-txn.component').then((m) => m.ListBankTxnComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-bank-txn/create-bank-txn.component').then((m) => m.CreateBankTxnComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-bank-txn/view-bank-txn.component').then((m) => m.ViewBankTxnComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-bank-txn/create-bank-txn.component').then((m) => m.CreateBankTxnComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-bank-txn/delete-bank-txn.component').then((m) => m.DeleteBankTxnComponent),
  },
];
