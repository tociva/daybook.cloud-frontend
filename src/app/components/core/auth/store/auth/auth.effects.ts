import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { catchError, filter, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { getUserManager, isUserManagerInitialized, setUserManager } from '../../user-manager-singleton';
import { ConfigStore } from '../config/config.store';
import { userSessionActions } from '../user-session/user-session.actions';
import { authActions } from './auth.actions';
import { AuthStatus } from './auth.model';
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
          authStore.setStatus(AuthStatus.USER_MANAGER_INITIALIZING);
          if (!isUserManagerInitialized()) {
            const manager = new UserManager({
              authority: config.auth.authority,
              client_id: config.auth.clientId,
              redirect_uri: config.auth.redirectUri,
              post_logout_redirect_uri: config.auth.postLogoutRedirect,
              scope: config.auth.scope,
              response_type: 'code',
              automaticSilentRenew: true,
              loadUserInfo: true,
              userStore: new WebStorageStateStore({ store: window.localStorage })
            });
  
            // Event handlers
            manager.events.addUserLoaded((user: User) => {
              authStore.setUser(user);
              authStore.setStatus(AuthStatus.AUTHENTICATED);
            });
  
            manager.events.addUserUnloaded(() => {
              authStore.setUser(null);
              authStore.setStatus(AuthStatus.UNAUTHENTICATED);
            });
  
            manager.events.addSilentRenewError(error => {
              authStore.setError(error.message);
            });
  
            setUserManager(manager);
          }
  
          authStore.setStatus(AuthStatus.USER_MANAGER_INITIALIZED);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  // Session hydration effect using createEffect instead of Angular's effect()
  hydrateSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.hydration),
        switchMap(() => 
          from(getUserManager().getUser()).pipe(
            map(user => {
              if(!user){
                authStore.setStatus(AuthStatus.HYDRATED_NO_USER);
              }else if(user.expired){
                getUserManager().removeUser().then(() => {
                  authStore.setStatus(AuthStatus.HYDRATED_EXPIRED_USER);
                  authStore.setUser(null);
                }).catch((error) => {
                  authStore.setStatus(AuthStatus.HYDRATED_ERROR);
                  authStore.setError(error.message);
                });

              }else{
                authStore.setUser(user);
                authStore.setStatus(AuthStatus.HYDRATED_VALID_USER);
              }
              return null; // No action to dispatch
            }),
            catchError((error) => {
              authStore.setStatus(AuthStatus.HYDRATED_ERROR);
              authStore.setError(error.message);
              return of(null);
            })
          )
        )
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

  /** Optionally, on loginSuccess, redirect to returnUri or home */
  loginSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(authActions.loginSuccess),
        withLatestFrom(toObservable(authStore.returnUri)),
        filter(([, returnUri]) => Boolean(returnUri)),
        map(([, returnUri]) => {
          authStore.setStatus(AuthStatus.AUTHENTICATED);
          return authActions.performRedirect({ returnUri: returnUri! })
        })
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
  
  /** Start logout (redirect to IdP logout) */
  logoutHydra: createEffect(
    () => {
      const actions$ = inject(Actions);
      return actions$.pipe(
        ofType(authActions.logoutHydra),
        tap(async () => {
          const userManager = getUserManager();
          const user = await userManager.getUser();
          userManager.removeUser();
          userManager.signoutRedirect({
            id_token_hint: user?.id_token,
          });
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

  silentRenewFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      return actions$.pipe(
        ofType(authActions.silentRenewFailure),
        tap(({ error }) => {
          console.warn('Error during silent renew:', error);
          const store = inject(Store);
          store.dispatch(authActions.logoutHydra());
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  silentRenewSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      return actions$.pipe(
        ofType(authActions.silentRenewSuccess),
        tap(({ user }) => {
          console.info('Silent renew success: user is still authenticated');
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  continueWithHydraLogout: createEffect(
    () => {
      const actions$ = inject(Actions);
      return actions$.pipe(
        ofType(userSessionActions.clearUserSessionSuccess),
        map(() =>  authActions.logoutHydra())
      );
    },
    { functional: true }
  )
  
};
