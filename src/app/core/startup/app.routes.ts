import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'app',
    loadChildren: () => import('../../components/core/app/app.routes').then(m => m.APP_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('../../components/core/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'bootstrap',
    loadChildren: () => import('../../components/core/bootsrap/bootsrap.routes').then(m => m.BOOTSTRAP_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },

];
