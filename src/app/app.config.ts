import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { configReducer } from './core/config/store/config.reducer';
import { ConfigEffects } from './core/config/store/config.effects';
import { provideHttpClient } from '@angular/common/http';
import { authReducer } from './core/auth/store/auth.reducer';
import { AuthEffects } from './core/auth/store/auth.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideStore({ config: configReducer, auth: authReducer }),
    provideEffects([ConfigEffects, AuthEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideRouterStore(),
  ],
};
