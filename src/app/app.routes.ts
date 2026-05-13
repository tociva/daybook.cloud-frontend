import { Routes } from '@angular/router';
import { CallbackComponent } from './components/features/auth/ui/callback/callback.component';
import { SilentRenewComponent } from './components/features/auth/ui/silent-renew/silent-renew.component';
import { EmptyRouteComponent } from './empty-route.component';
import { BootstrapOrganizationComponent } from './components/features/management/ui/bootstrap-organization/bootstrap-organization.component';
import { DashboardComponent } from './components/features/dashboard/ui/dashboard/dashboard.component';
import { SubscriptionSelectionComponent } from './components/features/management/ui/subscription-selection/subscription-selection.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: EmptyRouteComponent },
  { path: 'auth/callback', component: CallbackComponent },
  { path: 'auth/silent-renew', component: SilentRenewComponent },
  { path: 'app/dashboard', component: DashboardComponent },
  { path: 'app/management/subscription', component: SubscriptionSelectionComponent },
  {
    path: 'app/select-organization',
    loadComponent: () =>
      import(
        './components/features/management/ui/select-organization/select-organization.component'
      ).then((m) => m.SelectOrganizationComponent),
  },
  {
    path: 'app/profile',
    loadComponent: () =>
      import('./components/features/profile/ui/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: 'app/trading/bank-cash',
    loadChildren: () =>
      import('./components/features/trading/ui/bank-cash/bank-cash.routes').then(
        (m) => m.bankCashRoutes,
      ),
  },
  {
    path: 'app/trading/tax',
    loadChildren: () =>
      import('./components/features/trading/ui/tax/tax.routes').then((m) => m.taxRoutes),
  },
  {
    path: 'app/trading/tax-group',
    loadChildren: () =>
      import('./components/features/trading/ui/tax-group/tax-group.routes').then(
        (m) => m.taxGroupRoutes,
      ),
  },
  {
    path: 'app/trading/item',
    loadChildren: () =>
      import('./components/features/trading/ui/item/item.routes').then((m) => m.itemRoutes),
  },
  {
    path: 'app/trading/item-category',
    loadChildren: () =>
      import('./components/features/trading/ui/item-category/item-category.routes').then(
        (m) => m.itemCategoryRoutes,
      ),
  },
  {
    path: 'app/trading/vendor',
    loadChildren: () =>
      import('./components/features/trading/ui/vendor/vendor.routes').then((m) => m.vendorRoutes),
  },
  {
    path: 'app/trading/customer',
    loadChildren: () =>
      import('./components/features/trading/ui/customer/customer.routes').then(
        (m) => m.customerRoutes,
      ),
  },
  {
    path: 'app/trading/sale-invoice',
    loadChildren: () =>
      import('./components/features/trading/ui/sale-invoice/sale-invoice.routes').then(
        (m) => m.saleInvoiceRoutes,
      ),
  },
  {
    path: 'app/trading/customer-receipt',
    loadChildren: () =>
      import('./components/features/trading/ui/customer-receipt/customer-receipt.routes').then(
        (m) => m.customerReceiptRoutes,
      ),
  },
  {
    path: 'app/management/organization',
    loadChildren: () =>
      import('./components/features/management/ui/organization/organization.routes').then(
        (m) => m.organizationRoutes,
      ),
  },
  {
    path: 'app/management/branch',
    loadChildren: () =>
      import('./components/features/management/ui/branch/branch.routes').then(
        (m) => m.branchRoutes,
      ),
  },
  {
    path: 'app/management/fiscal-year',
    loadChildren: () =>
      import('./components/features/management/ui/fiscal-year/fiscal-year.routes').then(
        (m) => m.fiscalYearRoutes,
      ),
  },
  {
    path: 'app/accounting/ledger-category',
    loadChildren: () =>
      import('./components/features/accounting/ui/ledger-category/ledger-category.routes').then(
        (m) => m.ledgerCategoryRoutes,
      ),
  },
  {
    path: 'app/accounting/ledger',
    loadChildren: () =>
      import('./components/features/accounting/ui/ledger/ledger.routes').then(
        (m) => m.ledgerRoutes,
      ),
  },
  { path: 'bootstrap/bootstrap-organization', component: BootstrapOrganizationComponent },
];
