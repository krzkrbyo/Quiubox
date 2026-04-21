import { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'scans',
        loadComponent: () => import('./features/scans/scans-page.component').then((m) => m.ScansPageComponent),
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./features/results/results-list-page.component').then((m) => m.ResultsListPageComponent),
      },
      {
        path: 'results/:scanId',
        loadComponent: () =>
          import('./features/results/scan-detail-page.component').then((m) => m.ScanDetailPageComponent),
      },
      {
        path: 'results/:scanId/vuln/:vulnId',
        loadComponent: () =>
          import('./features/results/vulnerability-detail-page.component').then((m) => m.VulnerabilityDetailPageComponent),
      },
      {
        path: 'admin/users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/users-admin-page.component').then((m) => m.UsersAdminPageComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
