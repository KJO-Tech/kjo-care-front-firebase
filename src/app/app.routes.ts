import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import LandingComponent from './modules/landing/landing.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => LandingComponent,
  },
  {
    path: 'auth',
    loadChildren: () => import('./modules/auth/auth.routes'),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./shared/components/layout/dashboard/dashboard.component'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./modules/admin/dashboard/dashboard-page.component'),
      },
      {
        path: 'users',
        loadComponent: () => import('./modules/admin/user/user-page.component'),
      },
      {
        path: 'emergency-resources',
        loadComponent: () =>
          import(
            './modules/admin/emergency-resource/emergency-resource.component'
          ),
      },
      {
        path: 'blog-management',
        loadComponent: () => import('./modules/blog/blog-page.component'),
      },
      {
        path: 'moods',
        loadChildren: () =>
          import('./modules/admin/mood-analytics/mood-analytics.routes'),
      },
      {
        path: 'settings',
        loadChildren: () => import('./modules/admin/settings/settings.routes'),
      },
      // { path: 'health-centers', loadComponent: () => import('./modules/health-center/health-center.component') },
      {
        path: 'map',
        loadComponent: () =>
          import('./modules/health-center-map/health-center-map.component'),
      },
      {
        path: 'activity-category',
        loadComponent: () =>
          import(
            './modules/admin/activity-category/activity-category.component'
          ),
      },
      {
        path: 'daily-exercise',
        loadComponent: () =>
          import('./modules/admin/daily-exercise/daily-exercise.component'),
      },
      { path: '**', redirectTo: '' },
    ],
    canActivate: [adminGuard],
  },
  {
    path: 'app',
    loadComponent: () => import('./modules/main/main.component'),
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/main/home/home.component'),
      },
      {
        path: 'exercises',
        loadChildren: () => import('./modules/main/exercises/exercises.routes'),
      },
      {
        path: 'mood',
        loadChildren: () => import('./modules/main/mood/mood.routes'),
      },
      {
        path: 'community',
        loadChildren: () => import('./modules/main/community/community.routes'),
      },
      {
        path: 'resources',
        loadChildren: () => import('./modules/main/resources/resources.routes'),
      },
      {
        path: 'profile',
        loadComponent: () => import('./modules/main/profile/profile.component'),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./modules/main/notifications/notifications-page.component'),
      },
      {
        path: 'activity-subscription',
        loadComponent: () =>
          import(
            './modules/main/activity-subscription/activity-subscription.component'
          ),
      },
      { path: '**', redirectTo: '' },
    ],
    canActivate: [authGuard],
  },
];
