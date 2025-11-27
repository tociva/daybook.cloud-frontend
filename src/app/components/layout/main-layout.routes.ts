import { Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

export const MAIN_LAYOUT_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        // loadComponent: () => import('../features/home/home.component').then(m => m.HomeComponent),
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'management',
        loadChildren: () => import('../features/management/management.routes').then(m => m.managementRoutes),
      },
      {
        path: 'trading',
        loadChildren: () => import('../features/trading/trading.routes').then(m => m.tradingRoutes),
      },
      {
        path: 'accounting',
        loadChildren: () => import('../features/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES),
      },
      {
        path: 'accounting',
        loadChildren: () => import('../features/accounting/accounting.routes').then(m => m.ACCOUNTING_ROUTES),
      },
    ]
  }
];
