import { Routes } from '@angular/router';

export const BOOTSTRAP_ROUTES: Routes = [
  {
    path: 'bootstrap-organization',
    loadComponent: () => import('./bootsrap-organization/bootsrap-organization').then(m => m.BootsrapOrganization),
  },
];