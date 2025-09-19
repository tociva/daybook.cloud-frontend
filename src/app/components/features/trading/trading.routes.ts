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
    path: 'tax-group',
    loadChildren: () => import('./ui/tax-group/tax-group.routes').then(m => m.taxGroupRoutes),
  },
  {
    path: 'customer',
    loadChildren: () => import('./ui/customer/customer.routes').then(m => m.customerRoutes),
  },
  {
    path: 'vendor',
    loadChildren: () => import('./ui/vendor/vendor.routes').then(m => m.vendorRoutes),
  },
  {
    path: 'item',
    loadChildren: () => import('./ui/item/item.routes').then(m => m.itemRoutes),
  },
  {
    path: 'item-category',
    loadChildren: () => import('./ui/item-category/item-category.routes').then(m => m.itemCategoryRoutes),
  },
  {
    path: 'sale-invoice',
    loadChildren: () => import('./ui/sale-invoice/sale-invoice.routes').then(m => m.saleInvoiceRoutes),
  },
];