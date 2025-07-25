import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent),
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'callback',
        loadComponent: () => import('./core/auth/components/callback/callback.component').then(m => m.CallbackComponent),
      },
      {
        path: 'silent-callback',
        loadComponent: () => import('./core/auth/components/silent-callback/silent-callback.component').then(m => m.SilentCallbackComponent),
      },
      {
        path: 'logout',
        loadComponent: () => import('./core/auth/components/logout/logout.component').then(m => m.LogoutComponent),
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./core/auth/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  }
];
