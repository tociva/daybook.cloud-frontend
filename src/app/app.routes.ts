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
    path: 'app/trading/inventory-ledger-map',
    loadChildren: () =>
      import(
        './components/features/trading/ui/inventory-ledger-map/inventory-ledger-map.routes'
      ).then((m) => m.inventoryLedgerMapRoutes),
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
    path: 'app/trading/purchase-invoice',
    loadChildren: () =>
      import('./components/features/trading/ui/purchase-invoice/purchase-invoice.routes').then(
        (m) => m.purchaseInvoiceRoutes,
      ),
  },
  {
    path: 'app/trading/purchase-return',
    loadChildren: () =>
      import('./components/features/trading/ui/purchase-return/purchase-return.routes').then(
        (m) => m.purchaseReturnRoutes,
      ),
  },
  {
    path: 'app/trading/vendor-payment',
    loadChildren: () =>
      import('./components/features/trading/ui/vendor-payment/vendor-payment.routes').then(
        (m) => m.vendorPaymentRoutes,
      ),
  },
  {
    path: 'app/trading/gst-reconciliation',
    loadChildren: () =>
      import('./components/features/gst/ui/gst-reconciliation/gst-reconciliation.routes').then(
        (m) => m.gstReconciliationRoutes,
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
  {
    path: 'app/accounting/journal',
    loadChildren: () =>
      import('./components/features/accounting/ui/journal/journal.routes').then(
        (m) => m.journalRoutes,
      ),
  },
  {
    path: 'app/accounting/documents',
    loadChildren: () =>
      import('./components/features/accounting/ui/document/document.routes').then(
        (m) => m.documentRoutes,
      ),
  },
  {
    path: 'app/accounting/reports/trial-balance',
    loadChildren: () =>
      import('./components/features/accounting/ui/reports/trial-balance/trial-balance.routes').then(
        (m) => m.trialBalanceRoutes,
      ),
  },
  {
    path: 'app/accounting/reports/profit-loss',
    loadChildren: () =>
      import('./components/features/accounting/ui/reports/profit-loss/profit-loss.routes').then(
        (m) => m.profitLossRoutes,
      ),
  },
  {
    path: 'app/accounting/reports/balance-sheet',
    loadChildren: () =>
      import('./components/features/accounting/ui/reports/balance-sheet/balance-sheet.routes').then(
        (m) => m.balanceSheetRoutes,
      ),
  },
  {
    path: 'app/accounting/reports/ledger',
    loadChildren: () =>
      import('./components/features/accounting/ui/reports/ledger-report/ledger-report.routes').then(
        (m) => m.ledgerReportRoutes,
      ),
  },
  {
    path: 'app/accounting/reports/ledger-category',
    loadChildren: () =>
      import(
        './components/features/accounting/ui/reports/ledger-category-report/ledger-category-report.routes'
      ).then((m) => m.ledgerCategoryReportRoutes),
  },
  { path: 'bootstrap/bootstrap-organization', component: BootstrapOrganizationComponent },
];
