import { Routes } from '@angular/router';

export const bankingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./bank-txn/list-bank-txn/list-bank-txn').then(m => m.ListBankTxn),
  },
  {
    path: 'bank-txn/create',
    loadComponent: () => import('./bank-txn/create-bank-txn/create-bank-txn').then(m => m.CreateBankTxn),
  },
  {
    path: 'bank-txn/:id/edit',
    loadComponent: () => import('./bank-txn/create-bank-txn/create-bank-txn').then(m => m.CreateBankTxn),
  },
  {
    path: 'bank-txn/:id/view',
    loadComponent: () => import('./bank-txn/create-bank-txn/create-bank-txn').then(m => m.CreateBankTxn),
  },
  {
    path: 'bank-txn/:id/delete',
    loadComponent: () => import('./bank-txn/delete-bank-txn/delete-bank-txn').then(m => m.DeleteBankTxn),
  },
  {
    path: 'bank-ledger-map',
    loadComponent: () => import('./bank-ledger-map/list-bank-ledger-map/list-bank-ledger-map').then(m => m.ListBankLedgerMap),
  },
  {
    path: 'bank-ledger-map/create',
    loadComponent: () => import('./bank-ledger-map/create-bank-ledger-map/create-bank-ledger-map').then(m => m.CreateBankLedgerMap),
  },
  {
    path: 'bank-ledger-map/:id/edit',
    loadComponent: () => import('./bank-ledger-map/create-bank-ledger-map/create-bank-ledger-map').then(m => m.CreateBankLedgerMap),
  },
  {
    path: 'bank-ledger-map/:id/view',
    loadComponent: () => import('./bank-ledger-map/create-bank-ledger-map/create-bank-ledger-map').then(m => m.CreateBankLedgerMap),
  },
  {
    path: 'bank-ledger-map/:id/delete',
    loadComponent: () => import('./bank-ledger-map/delete-bank-ledger-map/delete-bank-ledger-map').then(m => m.DeleteBankLedgerMap),
  },
];

