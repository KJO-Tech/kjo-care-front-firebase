import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./profile.component'),
  },
  {
    path: 'edit',
    loadComponent: () => import('./edit-profile/edit-profile.component'),
  },
] as Routes;
