import { effect, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { catchError, filter, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { getUserManager, isUserManagerInitialized, setUserManager } from '../../user-manager-singleton';
import { ConfigStore } from '../config/config.store';
import { authActions } from './auth.actions';
import { AuthStore } from './auth.store';

export const authEffects = {
  hydrateReturnUri: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        tap(() => {
          const returnUri = localStorage.getItem('returnUri');
          authStore.setReturnUri(returnUri);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  /** Initialize OIDC client after config is loaded */
  initializeAuth: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.initialize),
        map(() => configStore.config()),
        filter((config) => !!config),
        tap((config) => {
          if (!isUserManagerInitialized()) {
            const manager = new UserManager({
              authority: config.auth.authority,
              client_id: config.auth.clientId,
              redirect_uri: config.auth.redirectUri,
              post_logout_redirect_uri: config.auth.hydraLogoutRedirectUri,
              scope: config.auth.scope,
              response_type: 'code',
              automaticSilentRenew: true,
              silent_redirect_uri: config.auth.silentRedirectUri,
              loadUserInfo: true,
              userStore: new WebStorageStateStore({ store: window.localStorage })
            });
  
            // Event handlers
            manager.events.addUserLoaded((user: User) => {
              authStore.setUser(user);
              authStore.setStatus('authenticated');
            });
  
            manager.events.addUserUnloaded(() => {
              authStore.setUser(null);
              authStore.setStatus('unauthenticated');
            });
  
            manager.events.addSilentRenewError(error => {
              authStore.setError(error.message);
            });
  
            setUserManager(manager);
          }
  
          // Status transition: from uninitialized → initializing → hydrated/authenticated
          authStore.setStatus('initializing');
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  /** Start login (redirect to IdP) */
  login: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.login),
        tap(({ returnUri }) => {
          const uri = returnUri ?? (window.location.pathname + window.location.search);
          authStore.setReturnUri(uri); // ✅ signal store + localStorage
          getUserManager().signinRedirect();
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  /** Handle OIDC redirect/callback */
  handleCallback: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(authActions.handleCallback),
        switchMap(() =>
          from(getUserManager().signinRedirectCallback()).pipe(
            map(user => authActions.loginSuccess({ user })),
            catchError(err =>
              from(getUserManager().getUser()).pipe(
                map(user => {
                  if (user && !user.expired) {
                    return authActions.loginSuccess({ user });
                  }
                  return authActions.loginFailure({ error: err.message });
                }),
                catchError(() => of(authActions.loginFailure({ error: err.message })))
              )
            )
          )
        )
      );
    },
    { functional: true }
  ),
  
  loginFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const router = inject(Router);

      return actions$.pipe(
        ofType(authActions.loginFailure),
        tap(() => {
          router.navigate(['/auth/login-failure']);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  logoutKratos: createEffect(
    () => {
      const actions$ = inject(Actions);
      const configStore = inject(ConfigStore);

      return actions$.pipe(
        ofType(authActions.logoutKratos),
        map(() => configStore.config()),
        filter((config): config is NonNullable<typeof config> => !!config),
        switchMap((config) =>
          from(
            fetch(`${config.auth.kratosUrl}/self-service/logout/browser`, {
              credentials: 'include',
            })
              .then((res) => res.json())
              .then((data) => {
                if (!data.logout_url) throw new Error('No logout_url received');
                return fetch(data.logout_url, {
                  method: 'GET',
                  credentials: 'include',
                });
              })
              .then(() => {
                // Optional: delete the session cookie explicitly
                document.cookie = 'ory_kratos_session=; Max-Age=0; path=/; domain=.daybook.cloud; secure; SameSite=None';
                return null; // resolve to continue
              })
          ).pipe(
            map(() => authActions.logoutHydra()),
            catchError((err) => {
              console.error('Error during Kratos logout:', err);
              return of(authActions.logoutHydra()); // fallback
            })
          )
        )
      );
    },
    { functional: true }
  ),
  
  /** Start logout (redirect to IdP logout) */
  logoutHydra: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(authActions.logoutHydra),
        tap(() => {
          getUserManager().signoutRedirect();
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  /** Handle logout callback (optional) */
  handleLogoutCallback: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(authActions.handleLogoutCallback),
        switchMap(() =>
          from(getUserManager().signoutRedirectCallback()).pipe(
            map(() => authActions.logoutSuccess()),
            catchError(err => of(authActions.logoutFailure({ error: err.message })))
          )
        )
      );
    },
    { functional: true }
  ),

  /** Optionally, on loginSuccess, redirect to returnUri or home */
  loginSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.loginSuccess),
        withLatestFrom(toObservable(authStore.returnUri)),
        filter(([, returnUri]) => Boolean(returnUri)),
        map(([, returnUri]) => authActions.performRedirect({ returnUri: returnUri! }))
      );
    },
    { functional: true }
  ),
  
  performRedirect: createEffect(
    () => {
      const actions$ = inject(Actions);
      const router = inject(Router);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.performRedirect),
        tap(({ returnUri }) => {
          router.navigateByUrl(returnUri);
          authStore.setReturnUri(null); // ✅ signal + localStorage handled
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  silentRenew: createEffect(
    () => {
      const actions$ = inject(Actions);

      return actions$.pipe(
        ofType(authActions.silentRenew),
        switchMap(() =>
          from(getUserManager().signinSilent()).pipe(
            map(user => user ? authActions.silentRenewSuccess({ user }) : authActions.silentRenewFailure({ error: 'No user found' })),
            catchError(error => of(authActions.silentRenewFailure({ error })))
          )
        )
      );
    },
    { functional: true }
  ),

  // Session hydration effect using createEffect instead of Angular's effect()
  hydrateSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.initialize),
        switchMap(() => 
          from(getUserManager().getUser()).pipe(
            map(user => {
              if (user && !user.expired) {
                authStore.setUser(user);
                authStore.setStatus('authenticated');
              } else {
                authStore.logout();
              }
              return null; // No action to dispatch
            }),
            catchError(() => {
              authStore.logout();
              return of(null);
            })
          )
        )
      );
    },
    { functional: true, dispatch: false }
  )
};
