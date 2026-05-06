import { Routes } from '@angular/router';

export const branchRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-branch/list-branch.component').then((m) => m.ListBranchComponent),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-branch/create-branch.component').then((m) => m.CreateBranchComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-branch/view-branch.component').then((m) => m.ViewBranchComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-branch/create-branch.component').then((m) => m.CreateBranchComponent),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-branch/delete-branch.component').then((m) => m.DeleteBranchComponent),
  },
];
