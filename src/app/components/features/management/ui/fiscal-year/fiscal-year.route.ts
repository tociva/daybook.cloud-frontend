import { Routes } from '@angular/router';

export const fiscalYearRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./list-fiscal-year/list-fiscal-year.component').then(m => m.ListFiscalYearComponent),  
  },
];
