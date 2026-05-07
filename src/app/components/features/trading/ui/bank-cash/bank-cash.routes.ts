import { Routes } from '@angular/router';

export const bankCashRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-bank-cash/list-bank-cash.component').then((m) => m.ListBankCashComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-bank-cash/create-bank-cash.component').then(
        (m) => m.CreateBankCashComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-bank-cash/view-bank-cash.component').then((m) => m.ViewBankCashComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-bank-cash/create-bank-cash.component').then(
        (m) => m.CreateBankCashComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-bank-cash/delete-bank-cash.component').then(
        (m) => m.DeleteBankCashComponent,
      ),
  },
];
