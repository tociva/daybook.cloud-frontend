import { Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

export const MAIN_LAYOUT_ROUTES: Routes = [
{
    path: '',
    component: MainLayoutComponent,
    children: [
    {
        path: '',
        loadComponent: () => import('../features/home/home.component').then(m => m.HomeComponent),
    },
    {
        path: 'dashboard',
        loadComponent: () => import('../features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    ]
}
];
