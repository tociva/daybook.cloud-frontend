import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  
  {
    path: 'bank-cash',
    loadComponent: () => import('./bank-cash/bank-cash/bank-cash').then(m => m.BankCash),
  }
];
