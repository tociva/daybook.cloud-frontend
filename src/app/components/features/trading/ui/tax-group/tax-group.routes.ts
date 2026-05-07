import { Routes } from '@angular/router';

export const taxGroupRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-tax-group/list-tax-group.component').then((m) => m.ListTaxGroupComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-tax-group/create-tax-group.component').then(
        (m) => m.CreateTaxGroupComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-tax-group/view-tax-group.component').then((m) => m.ViewTaxGroupComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-tax-group/create-tax-group.component').then(
        (m) => m.CreateTaxGroupComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-tax-group/delete-tax-group.component').then(
        (m) => m.DeleteTaxGroupComponent,
      ),
  },
];
