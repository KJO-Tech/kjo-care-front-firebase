import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import * as echarts from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { CLOUDINARY_CONFIG } from './core/config/cloudinary.config';
import { firebaseProviders } from './core/config/firebase.config';
import { STORAGE_PROVIDERS } from './core/config/storage.config';
import { httpTokenInterceptor } from './core/interceptors/http-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: CLOUDINARY_CONFIG, useValue: environment.cloudinary },
    ...STORAGE_PROVIDERS,
    ...firebaseProviders,
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: false,
      }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([httpTokenInterceptor]), withFetch()),
    importProvidersFrom(
      NgxEchartsModule.forRoot({
        echarts,
      }),
    ),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
