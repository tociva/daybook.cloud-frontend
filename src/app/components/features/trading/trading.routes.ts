import { Routes } from '@angular/router';

export const tradingRoutes: Routes = [
  {
    path: 'bank-cash',
    loadChildren: () => import('./ui/bank-cash/bank-cash.routes').then(m => m.bankCashRoutes),
  },
];
