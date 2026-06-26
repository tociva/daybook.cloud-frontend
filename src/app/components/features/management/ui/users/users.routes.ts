import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-users/list-users.component').then((m) => m.ListUsersComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-user/create-user.component').then((m) => m.CreateUserComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./view-user/view-user.component').then((m) => m.ViewUserComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-user/create-user.component').then((m) => m.CreateUserComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-user/delete-user.component').then((m) => m.DeleteUserComponent),
  },
];
