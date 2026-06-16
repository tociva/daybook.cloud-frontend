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
    path: 'activity',
    loadComponent: () =>
      import('./list-bank-cash-activity/list-bank-cash-activity.component').then(
        (m) => m.ListBankCashActivityComponent,
      ),
  },
  {
    path: 'contra/create',
    loadComponent: () =>
      import('./create-bank-contra/create-bank-contra.component').then(
        (m) => m.CreateBankContraComponent,
      ),
  },
  {
    path: 'contra/:id/edit',
    loadComponent: () =>
      import('./create-bank-contra/create-bank-contra.component').then(
        (m) => m.CreateBankContraComponent,
      ),
  },
  {
    path: 'contra/:id/delete',
    loadComponent: () =>
      import('./delete-bank-contra/delete-bank-contra.component').then(
        (m) => m.DeleteBankContraComponent,
      ),
  },
  {
    path: 'contra/:id',
    loadComponent: () =>
      import('./view-bank-contra/view-bank-contra.component').then(
        (m) => m.ViewBankContraComponent,
      ),
  },
  {
    path: 'contra',
    loadComponent: () =>
      import('./list-bank-contra/list-bank-contra.component').then(
        (m) => m.ListBankContraComponent,
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
