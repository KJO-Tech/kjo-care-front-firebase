import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { httpTokenInterceptor } from './core/interceptors/http-token.interceptor';
import { NgxEchartsModule } from 'ngx-echarts';
import * as echarts from 'echarts';

import { firebaseProviders } from './core/config/firebase.config';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...firebaseProviders,
    provideClientHydration(withHttpTransferCacheOptions({
      includePostRequests: true
    }),
      withEventReplay()
    ),
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
    )
  ]
};
