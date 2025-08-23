import { Routes } from '@angular/router';

export const itemRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-item/list-item').then(m => m.ListItem),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-item/create-item').then(m => m.CreateItem),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-item/create-item').then(m => m.CreateItem),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-item/create-item').then(m => m.CreateItem),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-item/delete-item').then(m => m.DeleteItem),
  },
];
