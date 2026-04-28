import { Routes } from '@angular/router';
import { CallbackComponent } from './auth/callback/callback.component';
import { EmptyRouteComponent } from './empty-route.component';
import { BootstrapOrganizationComponent } from './pages/bootstrap-organization/bootstrap-organization.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: EmptyRouteComponent },
  { path: 'auth/callback', component: CallbackComponent },
  { path: 'app/dashboard', component: DashboardComponent },
  { path: 'bootstrap/bootstrap-organization', component: BootstrapOrganizationComponent },
];
