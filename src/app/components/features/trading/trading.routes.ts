import { Routes } from '@angular/router';

export const tradingRoutes: Routes = [
  {
    path: 'bank-cash',
    loadChildren: () => import('./ui/bank-cash/bank-cash.routes').then(m => m.bankCashRoutes),
  },
  {
    path: 'tax',
    loadChildren: () => import('./ui/tax/tax.routes').then(m => m.taxRoutes),
  },
  {
    path: 'customer',
    loadChildren: () => import('./ui/customer/customer.routes').then(m => m.customerRoutes),
  },
  {
    path: 'item',
    loadChildren: () => import('./ui/item/item.routes').then(m => m.itemRoutes),
  },
  {
    path: 'item-category',
    loadChildren: () => import('./ui/item-category/item-category.routes').then(m => m.itemCategoryRoutes),
  },
];
