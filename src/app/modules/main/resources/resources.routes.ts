import { Routes } from '@angular/router';
import ResourcesComponent from './resources.component';

export default [
  {
    path: '',
    component: ResourcesComponent,
    children: [
      { path: '', redirectTo: 'emergency', pathMatch: 'full' },
      {
        path: 'health-centers',
        loadComponent: () =>
          import(
            '../../../shared/components/coming-soon/coming-soon.component'
          ),
      },
      {
        path: 'emergency',
        loadComponent: () =>
          import('./resources-emergency/resources-emergency.component'),
      },
      { path: '**', redirectTo: 'emergency' },
    ],
  },
] as Routes;
