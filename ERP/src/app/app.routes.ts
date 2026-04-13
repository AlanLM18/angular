import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/auth/landing-page/landing-page').then(m => m.LandingPageComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      { path: '',            loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
      { path: 'dashboard',   loadComponent: () => import('./pages/home/admin/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'groups',      loadComponent: () => import('./pages/home/admin/groups/groups').then(m => m.GroupsComponent) },
      { path: 'users',       loadComponent: () => import('./pages/home/admin/users/users').then(m => m.UsersComponent) },
      { path: 'profile',     loadComponent: () => import('./pages/home/admin/profile/profile').then(m => m.ProfileComponent) },
      { path: 'ticket/:id',  loadComponent: () => import('./pages/home/admin/ticket-detail/ticket-detail').then(m => m.TicketDetailComponent) },
      { path: 'super-admin', loadComponent: () => import('./pages/home/admin/super-admin/super-admin').then(m => m.SuperAdminComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
