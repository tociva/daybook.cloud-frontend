import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { defaultDarkThemePreset, provideTailngTheme } from '@tailng-ui/theme';
import { authBearerTokenInterceptor } from './components/features/auth/data/auth-bearer-token.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authBearerTokenInterceptor])),
    provideRouter(routes),
    provideTailngTheme({ theme: defaultDarkThemePreset }),
  ],
};
