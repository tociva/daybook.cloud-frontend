import { Routes } from '@angular/router';

export const bankCashRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-bank-cash/list-bank-cash').then(m => m.ListBankCash),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-bank-cash/create-bank-cash').then(m => m.CreateBankCash),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-bank-cash/create-bank-cash').then(m => m.CreateBankCash),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-bank-cash/create-bank-cash').then(m => m.CreateBankCash),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./create-bank-cash/create-bank-cash').then(m => m.CreateBankCash),
  },
];
