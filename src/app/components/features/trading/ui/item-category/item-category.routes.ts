import { Routes } from '@angular/router';

export const itemCategoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-item-category/list-item-category').then(m => m.ListItemCategory),
  },
  {
    path: 'create',
    loadComponent: () => import('./create-item-category/create-item-category').then(m => m.CreateItemCategory),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./create-item-category/create-item-category').then(m => m.CreateItemCategory),
  },
  {
    path: ':id/view',
    loadComponent: () => import('./create-item-category/create-item-category').then(m => m.CreateItemCategory),
  },
  {
    path: ':id/delete',
    loadComponent: () => import('./delete-item-category/delete-item-category').then(m => m.DeleteItemCategory),
  },
];
