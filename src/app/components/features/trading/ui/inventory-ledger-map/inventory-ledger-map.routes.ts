import { Routes } from '@angular/router';

export const inventoryLedgerMapRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list-inventory-ledger-map/list-inventory-ledger-map.component').then(
        (m) => m.ListInventoryLedgerMapComponent,
      ),
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create-inventory-ledger-map/create-inventory-ledger-map.component').then(
        (m) => m.CreateInventoryLedgerMapComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./view-inventory-ledger-map/view-inventory-ledger-map.component').then(
        (m) => m.ViewInventoryLedgerMapComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./create-inventory-ledger-map/create-inventory-ledger-map.component').then(
        (m) => m.CreateInventoryLedgerMapComponent,
      ),
  },
  {
    path: ':id/delete',
    loadComponent: () =>
      import('./delete-inventory-ledger-map/delete-inventory-ledger-map.component').then(
        (m) => m.DeleteInventoryLedgerMapComponent,
      ),
  },
];

