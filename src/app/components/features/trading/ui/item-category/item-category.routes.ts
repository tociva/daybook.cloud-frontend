import { Routes } from '@angular/router';

export const itemCategoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-item-category/list-item-category.component').then(
        (m) => m.ListItemCategoryComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-item-category/create-item-category.component').then(
        (m) => m.CreateItemCategoryComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-item-category/view-item-category.component').then(
        (m) => m.ViewItemCategoryComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-item-category/create-item-category.component').then(
        (m) => m.CreateItemCategoryComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-item-category/delete-item-category.component').then(
        (m) => m.DeleteItemCategoryComponent,
      ),
  },
];
