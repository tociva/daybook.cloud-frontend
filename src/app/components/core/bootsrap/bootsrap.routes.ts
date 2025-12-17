import { Routes } from '@angular/router';
import { authGuard } from '../auth/auth.guard';

export const BOOTSTRAP_ROUTES: Routes = [
  {
    path: 'bootstrap-organization',
    canMatch: [authGuard],
    loadComponent: () => import('./bootsrap-organization/bootsrap-organization').then(m => m.BootsrapOrganization),
  },
];