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
    path: 'app/trading/bank-cash',
    loadChildren: () =>
      import('./components/features/trading/ui/bank-cash/bank-cash.routes').then(
        (m) => m.bankCashRoutes,
      ),
  },
  { path: 'bootstrap/bootstrap-organization', component: BootstrapOrganizationComponent },
];
