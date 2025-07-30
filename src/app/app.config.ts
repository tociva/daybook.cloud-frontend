import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
import { configReducer } from './core/config/store/config.reducer';
import { ConfigEffects } from './core/config/store/config.effects';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authReducer } from './core/auth/store/auth/auth.reducer';
import { AuthEffects } from './core/auth/store/auth/auth.effects';
import { bankCashReducer } from './features/inventory/bank-cash/store/bank-cash.reducer';
import { BankCashEffects } from './features/inventory/bank-cash/store/bank-cash.effects';
import { authInterceptor } from './core/auth/auth.interceptor';
import { userSessionReducer } from './core/auth/store/user-session/user-session.reducer';
import { organizationReducer } from './features/organization/organization/store/organization.reducer';
import { branchReducer } from './features/organization/branch/store/branch.reducer';
import { fiscalYearReducer } from './features/organization/fiscal-year/store/fiscal-year.reducer';
import { subscriptionReducer } from './features/subscription/subscription/store/subscription.reducer';
import { UserSessionEffects } from './core/auth/store/user-session/user-session.effects';
import { OrganizationEffects } from './features/organization/organization/store/organization.effects';
import { BranchEffects } from './features/organization/branch/store/branch.effects';
import { FiscalYearEffects } from './features/organization/fiscal-year/store/fiscal-year.effects';
import { SubscriptionEffects } from './features/subscription/subscription/store/subscription.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideStore({ config: configReducer, auth: authReducer, bankCash: bankCashReducer,
      userSession: userSessionReducer,
      organization: organizationReducer,
      branch: branchReducer,
      fiscalYear: fiscalYearReducer,
      subscription: subscriptionReducer,
     }),
    provideEffects([ConfigEffects, AuthEffects, BankCashEffects, UserSessionEffects, OrganizationEffects, BranchEffects, FiscalYearEffects, SubscriptionEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideRouterStore(),
  ],
};
