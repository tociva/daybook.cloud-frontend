import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authInterceptor } from './components/core/auth/auth.interceptor';
import { authEffects } from './components/core/auth/store/auth/auth.effects';
import { configEffects } from './components/core/auth/store/config/config.effects';
import { provideStore } from '@ngrx/store';
import { provideAppIcons } from './providers/icons.provider';
import { userSessionEffects } from './components/core/auth/store/user-session/user-session.effects';
import { organizationEffects } from './components/features/management/store/organization/organization.effects';
import { countryEffects } from './components/shared/store/country/country.effect';
import { currencyEffects } from './components/shared/store/currency/currency.effect';
import { dateFormatEffects } from './components/shared/store/date-format/date-format.effect';
import { toastEffects } from './components/shared/store/toast/toast.effects';
import { httpEffects } from './state/http/http.effects';
import { bankCashEffects } from './components/features/trading/store/bank-cash/bank-cash.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(),
    provideEffects([
      configEffects,
      authEffects,
      userSessionEffects,
      organizationEffects,
      countryEffects,
      currencyEffects,
      dateFormatEffects,
      toastEffects,
      httpEffects,
      bankCashEffects
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideRouterStore(),
    provideAppIcons(),
  ],
};
