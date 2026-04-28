import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
import { AppConfig } from '../config/app-config.model';
import { AppConfigStore } from '../config/app-config.store';
import { AppToastTone } from '../toast/toast.model';
import { ToastStore } from '../toast/toast.store';
import { UserSession } from '../user-session/user-session.model';
import { UserSessionService } from '../user-session/user-session.service';
import { UserSessionStore } from '../user-session/user-session.store';
import { AppStartupStatus, AppSystemModel } from './app-system.model';
import { initialAppSystemState } from './app-system.state';

const BOOTSTRAP_ORGANIZATION_ROUTE = '/bootstrap/bootstrap-organization';

function isConfigLoadedStatus(status: AppStartupStatus): boolean {
  return (
    status === 'config-loaded' ||
    status === 'auth-provider-unavailable' ||
    status === 'processing-login-callback' ||
    status === 'login-success' ||
    status === 'loading-user-session' ||
    status === 'user-session-ready' ||
    status === 'user-session-error' ||
    status === 'checking-session' ||
    status === 'session-active' ||
    status === 'session-missing' ||
    status === 'redirecting-to-login' ||
    status === 'redirecting-to-bootstrap' ||
    status === 'redirecting-to-dashboard' ||
    status === 'session-error' ||
    status === 'login-error'
  );
}

function buildToast(
  status: AppStartupStatus,
  error: string | null,
): Readonly<{ tone: AppToastTone; message: string }> | null {
  switch (status) {
    case 'loading-config':
      return { tone: 'neutral', message: 'Loading config...' };
    case 'config-loaded':
      return { tone: 'success', message: 'Config loaded' };
    case 'auth-provider-unavailable':
      return {
        tone: 'warning',
        message: error ?? 'Authentication is temporarily unavailable. Hydra lookups are paused.',
      };
    case 'processing-login-callback':
      return { tone: 'neutral', message: 'Completing login...' };
    case 'login-success':
      return { tone: 'success', message: 'Login completed' };
    case 'loading-user-session':
      return { tone: 'neutral', message: 'Loading Daybook Cloud user session...' };
    case 'user-session-ready':
      return { tone: 'success', message: 'Daybook Cloud user session loaded' };
    case 'user-session-error':
      return { tone: 'danger', message: error ?? 'Daybook Cloud user session failed' };
    case 'checking-session':
      return { tone: 'neutral', message: 'Checking active session...' };
    case 'session-active':
      return { tone: 'success', message: 'Existing session found' };
    case 'session-missing':
      return { tone: 'neutral', message: 'No active session' };
    case 'redirecting-to-login':
      return { tone: 'neutral', message: 'Redirecting to login...' };
    case 'redirecting-to-bootstrap':
      return { tone: 'neutral', message: 'Opening organization setup...' };
    case 'redirecting-to-dashboard':
      return { tone: 'neutral', message: 'Opening dashboard...' };
    case 'config-load-error':
      return { tone: 'danger', message: error ?? 'Config load failed' };
    case 'session-error':
      return { tone: 'danger', message: error ?? 'Session check failed' };
    case 'login-error':
      return { tone: 'danger', message: error ?? 'Login redirect failed' };
    default:
      return null;
  }
}

function setStartupStatus(
  system: AppSystemModel,
  status: AppStartupStatus,
  error: string | null = null,
): AppSystemModel {
  return {
    ...system,
    configLoaded: isConfigLoadedStatus(status),
    startupStatus: status,
    error,
  };
}

function resetStartup(system: AppSystemModel): AppSystemModel {
  return {
    ...system,
    configLoaded: false,
    startupStatus: 'idle',
    error: null,
  };
}

function asErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function hasOwnOrganizations(session: UserSession): boolean {
  return Boolean(session.ownorgs?.length);
}

export const AppSystemStore = signalStore(
  { providedIn: 'root' },
  withState(initialAppSystemState),
  withComputed(({ system }) => ({
    isConfigLoaded: computed(() => system().configLoaded),
    startupStatus: computed(() => system().startupStatus),
    error: computed(() => system().error),
  })),
  withMethods(
    (
      store,
      appConfigStore = inject(AppConfigStore),
      authStore = inject(AuthStore),
      authService = inject(AuthService),
      router = inject(Router),
      toastStore = inject(ToastStore),
      userSessionService = inject(UserSessionService),
      userSessionStore = inject(UserSessionStore),
    ) => {
      function updateStartupStatus(
        status: AppStartupStatus,
        error: string | null = null,
        options: { reset?: boolean } = {},
      ): void {
        patchState(store, (state) => ({
          system: setStartupStatus(
            options.reset ? resetStartup(state.system) : state.system,
            status,
            error,
          ),
        }));

        const toast = buildToast(status, error);

        if (toast) {
          toastStore.show(toast.message, { tone: toast.tone });
        }
      }

      async function loadConfigForStartup(): Promise<AppConfig | null> {
        authStore.resetSessionState();
        userSessionStore.resetSession();
        updateStartupStatus('loading-config', null, { reset: true });

        const config = await appConfigStore.load();

        if (!config) {
          updateStartupStatus('config-load-error', appConfigStore.error() ?? 'Config load failed');
          return null;
        }

        updateStartupStatus('config-loaded');

        return config;
      }

      async function createAndRouteUserSession(config: AppConfig): Promise<void> {
        userSessionStore.setLoading();
        updateStartupStatus('loading-user-session');

        try {
          const session = await userSessionService.createUserSession(
            config.apiBaseUrl,
            config.auth,
          );
          userSessionStore.setSession(session);

          const returnUri = authService.consumeReturnUri(config.auth);
          const targetRoute = hasOwnOrganizations(session)
            ? returnUri
            : BOOTSTRAP_ORGANIZATION_ROUTE;
          const redirectStatus: AppStartupStatus =
            targetRoute === BOOTSTRAP_ORGANIZATION_ROUTE
              ? 'redirecting-to-bootstrap'
              : 'redirecting-to-dashboard';

          updateStartupStatus(redirectStatus);
          await router.navigateByUrl(targetRoute);
          updateStartupStatus('user-session-ready');
        } catch (error) {
          const errorMessage = asErrorMessage(error, 'Unable to load Daybook Cloud user session');
          userSessionStore.setError(errorMessage);
          updateStartupStatus('user-session-error', errorMessage);
        }
      }

      async function handleConfiguredLoginCallback(config: AppConfig): Promise<void> {
        updateStartupStatus('processing-login-callback');

        try {
          const user = await authService.completeLogin(config.auth);
          const isAuthenticated = Boolean(user && !user.expired);
          authStore.setSessionState(isAuthenticated);
          const expiredSessionMessage = isAuthenticated
            ? null
            : authService.rememberLoginError(
                config.auth,
                'Login completed, but the session is already expired.',
              );

          updateStartupStatus(
            isAuthenticated ? 'login-success' : 'login-error',
            expiredSessionMessage,
          );

          if (isAuthenticated) {
            await createAndRouteUserSession(config);
          }
        } catch (error) {
          authStore.resetSessionState();
          authService.clearLoginCallbackUrl();

          if (authService.isProviderAvailabilityError(error)) {
            updateStartupStatus(
              'auth-provider-unavailable',
              authService.pauseProvider(config.auth, authService.buildProviderUnavailableMessage()),
            );
            return;
          }

          await authService.clearStaleLoginState(config.auth);
          const loginErrorMessage = authService.rememberLoginError(
            config.auth,
            authService.buildLoginErrorMessage(error),
          );
          updateStartupStatus('login-error', loginErrorMessage);
        }
      }

      return {
        async initialize(): Promise<void> {
          const config = await loadConfigForStartup();

          if (!config) {
            return;
          }

          const pausedProviderMessage = authService.getPausedProviderMessage(config.auth);
          const loginErrorMessage = authService.getLoginErrorMessage(config.auth);

          if (authService.isLoginCallbackRoute(config.auth)) {
            await handleConfiguredLoginCallback(config);
            return;
          }

          if (loginErrorMessage) {
            updateStartupStatus('login-error', loginErrorMessage);
            return;
          }

          if (
            authService.isAuthServerRoute() ||
            (authService.isAuthServerOrigin(config.auth) &&
              authService.isOutsideClientRedirectOrigin(config.auth))
          ) {
            authStore.resetSessionState();
            updateStartupStatus('login-error', authService.buildAuthServerRouteMessage());
            return;
          }

          if (authService.isPostLoginReturnRoute(config.auth)) {
            authStore.resetSessionState();
            authService.clearLoginCallbackUrl();
            updateStartupStatus('login-error', authService.buildIncompleteLoginReturnMessage());
            return;
          }

          updateStartupStatus('checking-session');

          try {
            const hasActiveSession = await authService.hasActiveSession(config.auth);
            authStore.setSessionState(hasActiveSession);

            if (hasActiveSession) {
              authService.clearPausedProvider(config.auth);
            }

            updateStartupStatus(hasActiveSession ? 'session-active' : 'session-missing');

            if (hasActiveSession) {
              await createAndRouteUserSession(config);
              return;
            }

            if (!hasActiveSession) {
              if (pausedProviderMessage) {
                updateStartupStatus('auth-provider-unavailable', pausedProviderMessage);
                return;
              }

              updateStartupStatus('redirecting-to-login');

              try {
                await authService.startLogin(config.auth);
              } catch (error) {
                if (authService.isProviderAvailabilityError(error)) {
                  updateStartupStatus(
                    'auth-provider-unavailable',
                    authService.pauseProvider(
                      config.auth,
                      authService.buildProviderUnavailableMessage(),
                    ),
                  );
                  return;
                }

                const loginErrorMessage = authService.rememberLoginError(
                  config.auth,
                  asErrorMessage(error, 'Login redirect failed'),
                );
                updateStartupStatus('login-error', loginErrorMessage);
              }
            }
          } catch (error) {
            authStore.resetSessionState();

            updateStartupStatus('session-error', asErrorMessage(error, 'Session check failed'));
          }
        },
        async logout(): Promise<void> {
          const config = appConfigStore.config() ?? (await appConfigStore.load());

          if (!config) {
            return;
          }

          try {
            await userSessionService.clearUserSession(config.apiBaseUrl, config.auth);
          } catch {
            // Logout should continue even if the backend session is already gone.
          } finally {
            userSessionStore.resetSession();
          }

          await authService.startLogout(config.auth);
        },
        async handleLoginCallback(): Promise<void> {
          const config = await loadConfigForStartup();

          if (!config) {
            return;
          }

          if (!authService.isLoginCallbackRoute(config.auth)) {
            authStore.resetSessionState();
            updateStartupStatus('login-error', authService.buildIncompleteLoginReturnMessage());
            return;
          }

          await handleConfiguredLoginCallback(config);
        },
      };
    },
  ),
);
