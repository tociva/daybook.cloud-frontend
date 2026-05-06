import { Routes } from '@angular/router';

export const fiscalYearRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-fiscal-year/list-fiscal-year.component').then(
        (m) => m.ListFiscalYearComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-fiscal-year/create-fiscal-year.component').then(
        (m) => m.CreateFiscalYearComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-fiscal-year/view-fiscal-year.component').then(
        (m) => m.ViewFiscalYearComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-fiscal-year/create-fiscal-year.component').then(
        (m) => m.CreateFiscalYearComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-fiscal-year/delete-fiscal-year.component').then(
        (m) => m.DeleteFiscalYearComponent,
      ),
  },
];
