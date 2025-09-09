import { Routes } from '@angular/router';

export const ACCOUNTING_ROUTES: Routes = [
  {
    path: 'ledger',
    loadChildren: () => import('./ui/ledger/ledger.routes').then(m => m.ledgerRoutes),
  },
  {
    path: 'ledger-category',
    loadChildren: () => import('./ui/ledger-category/ledger-category.routes').then(m => m.ledgerCategoryRoutes),
  },
];
