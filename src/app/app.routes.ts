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
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'callback',
        loadComponent: () => import('./core/auth/components/callback/callback.component').then(m => m.CallbackComponent),
      }
    ]
  },
  // Optional: handle unknown routes
  {
    path: '**',
    loadComponent: () => import('./core/auth/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  }
];
