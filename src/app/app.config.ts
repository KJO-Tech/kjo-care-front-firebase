import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom, isDevMode } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { httpTokenInterceptor } from './core/interceptors/http-token.interceptor';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';
import { firebaseProviders } from './core/config/firebase.config';
import { STORAGE_PROVIDERS } from './core/config/storage.config';
import { CLOUDINARY_CONFIG } from './core/config/cloudinary.config';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: CLOUDINARY_CONFIG, useValue: environment.cloudinary },
    ...STORAGE_PROVIDERS,
    ...firebaseProviders,
    provideRouter(routes,
      withViewTransitions({
        skipInitialTransition: false,
      })
    ),
    provideHttpClient(
      withInterceptors([httpTokenInterceptor]), withFetch()
    ),
    importProvidersFrom(
      NgxEchartsModule.forRoot({
        echarts
      })
    ), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
