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
import { taxEffects } from './components/features/trading/store/tax/tax.effects';
import { customerEffects } from './components/features/trading/store/customer/customer.effects';
import { itemEffects } from './components/features/trading/store/item/item.effects';
import { itemCategoryEffects } from './components/features/trading/store/item-category/item-category.effects';
import { vendorEffects } from './components/features/trading/store/vendor/vendor.effects';
import { ledgerEffects } from './components/features/accounting/store/ledger/ledger.effects';
import { ledgerCategoryEffects } from './components/features/accounting/store/ledger-category/ledger-category.effects';
import { branchEffects } from './components/features/management/store/branch/branch.effects';

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
      branchEffects,
      countryEffects,
      currencyEffects,
      dateFormatEffects,
      toastEffects,
      httpEffects,
      bankCashEffects,
      taxEffects,
      customerEffects,
      itemEffects,
      itemCategoryEffects,
      vendorEffects,
      ledgerEffects,
      ledgerCategoryEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideRouterStore(),
    provideAppIcons(),
  ],
};
