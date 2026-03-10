import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/auth/landing-page/landing-page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home').then((m) => m.HomeComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/home/admin/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/home/admin/products/products').then((m) => m.ProductsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/home/admin/users/users').then((m) => m.UsersComponent),
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./pages/home/admin/groups/groups').then((m) => m.GroupsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/home/admin/profile/profile').then((m) => m.ProfileComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
