import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  
  {
    path: 'bank-cash',
    loadChildren: () => import('./bank-cash/bank-cash.route').then(m => m.bankCashRoutes),  
  }
];
