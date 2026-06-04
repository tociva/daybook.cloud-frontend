import type { Routes } from '@angular/router';

export const balanceSheetRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./balance-sheet.component').then((m) => m.BalanceSheetComponent),
  },
];
