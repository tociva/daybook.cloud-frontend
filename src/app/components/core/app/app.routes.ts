import { Routes } from '@angular/router';
import { authGuard } from '../auth/auth.guard';
import { GateWay } from './gate-way/gate-way';

export const APP_ROUTES: Routes = [
  {
    path: '',
    canMatch: [authGuard], // blocks matching & lazy loading if not authed
    component: GateWay,
    loadChildren: () => import('../../layout/main-layout.routes').then(m => m.MAIN_LAYOUT_ROUTES),
  }
];
