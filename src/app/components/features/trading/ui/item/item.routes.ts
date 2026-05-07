import { Routes } from '@angular/router';

export const itemRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-item/list-item.component').then((m) => m.ListItemComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-item/create-item.component').then((m) => m.CreateItemComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./view-item/view-item.component').then((m) => m.ViewItemComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-item/create-item.component').then((m) => m.CreateItemComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-item/delete-item.component').then((m) => m.DeleteItemComponent),
  },
];
