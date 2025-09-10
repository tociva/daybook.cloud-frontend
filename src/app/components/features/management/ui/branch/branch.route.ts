import { Routes } from '@angular/router';

export const branchRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-branch/list-branch.component').then(m => m.ListBranchComponent),  
  },
];
