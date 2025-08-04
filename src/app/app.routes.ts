import { Routes } from '@angular/router';
import { authGuard } from './components/core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadChildren: () => import('./components/layout/main-layout.routes').then(m => m.MAIN_LAYOUT_ROUTES),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'callback',
        loadComponent: () => import('./components/core/auth/ui/callback/callback.component').then(m => m.CallbackComponent),
      },
      {
        path: 'silent-callback',
        loadComponent: () => import('./components/core/auth/ui/silent-callback/silent-callback.component').then(m => m.SilentCallbackComponent),
      },
      {
        path: 'logout',
        loadComponent: () => import('./components/core/auth/ui/logout/logout.component').then(m => m.LogoutComponent),
      },
      {
        path: 'login-failure',
        loadComponent: () => import('./components/core/auth/ui/login-failure/login-failure.component').then(m => m.LoginFailureComponent),
      }
    ]
  },
  {
    path: '**',
    canActivate: [authGuard],
    loadComponent: () => import('./components/core/auth/ui/not-found/not-found.component').then(m => m.NotFoundComponent),
  }
];
