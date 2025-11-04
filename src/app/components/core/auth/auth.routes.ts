import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login-failure',
    loadComponent: () => import('./ui/login-failure/login-failure.component').then(m => m.LoginFailureComponent),
  },
  {
    path: 'callback',
    loadComponent: () => import('./ui/callback/callback.component').then(m => m.CallbackComponent),
  },
  {
    path: 'silent-callback',
    loadComponent: () => import('./ui/silent-callback/silent-callback.component').then(m => m.SilentCallbackComponent),
  },
  {
    path: 'do-logout',
    loadComponent: () => import('./ui/do-logout/do-logout.component').then(m => m.DoLogoutComponent),
  },
  {
    path: 'logout',
    loadComponent: () => import('./ui/logout/logout.component').then(m => m.LogoutComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./ui/login/login').then(m => m.Login),
  },
  {
    path: 'validate',
    loadComponent: () => import('./ui/validate/validate').then(m => m.Validate),
  },

];
