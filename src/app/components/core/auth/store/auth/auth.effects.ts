import { effect, inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { catchError, filter, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { getUserManager, isUserManagerInitialized, setUserManager } from '../../user-manager-singleton';
import { ConfigStore } from '../config/config.store';
import * as AuthActions from './auth.actions';
import { AuthStore } from './auth.store';


@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);
  private readonly configStore = inject(ConfigStore);
  private readonly authStore = inject(AuthStore);

  hydrateReturnUri$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => {
        const returnUri = localStorage.getItem('returnUri');
        return AuthActions.setReturnUri({ returnUri });
      })
    )
  );

  /** Initialize OIDC client after config is loaded */
  initializeAuth$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.initializeAuth),
        map(() => this.configStore.config()),
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
              this.authStore.setUser(user);
              this.authStore.setStatus('authenticated');
            });
  
            manager.events.addUserUnloaded(() => {
              this.authStore.setUser(null);
              this.authStore.setStatus('unauthenticated');
            });
  
            manager.events.addSilentRenewError(error => {
              this.authStore.setError(error.message);
            });
  
            setUserManager(manager);
          }
  
          // Status transition: from uninitialized → initializing → hydrated/authenticated
          this.authStore.setStatus('initializing');
        })
      ),
    { dispatch: false }
  );

  hydrateSessionEffect = effect(() => {
    if (this.authStore.status() === 'initializing') {
      from(getUserManager().getUser()).subscribe(user => {
        if (user && !user.expired) {
          this.authStore.setUser(user);
          this.authStore.setStatus('authenticated');
        } else {
          this.authStore.logout();
        }
      });
    }
  });
  

  /** Start login (redirect to IdP) */
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      tap(({returnUri}) => {
        const uri = returnUri ?? (window.location.pathname + window.location.search);
        this.store.dispatch(AuthActions.setReturnUri({ returnUri: uri }));
        getUserManager().signinRedirect();
      })
    ),
    { dispatch: false }
  );

  /** Handle OIDC redirect/callback */
  handleCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallback),
      switchMap(() =>
        from(getUserManager().signinRedirectCallback()).pipe(
          map(user => AuthActions.loginSuccess({ user })),
          catchError(err =>
            from(getUserManager().getUser()).pipe(
              map(user => {
                if (user && !user.expired) {
                  return AuthActions.loginSuccess({ user });
                }
                return AuthActions.loginFailure({ error: err.message });
              }),
              catchError(() => of(AuthActions.loginFailure({ error: err.message })))
            )
          )
        )
      )
    )
  );
  
  loginFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginFailure),
      tap(() => {
        this.router.navigate(['/auth/login-failure']);
      })
    )
  );

  logoutKratos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutKratos),
      map(() => this.configStore.config()),
      filter((config) => !!config),
      tap((config) => {
        const url = config.auth.kratosUrl;
  
        fetch(`${url}/self-service/logout/browser`, {
          credentials: "include"
        })
          .then(res => res.json())
          .then(data => {
            if (!data.logout_url) throw new Error('No logout_url received');
  
            // Call logout token URL via fetch
            return fetch(data.logout_url, {
              method: 'GET',
              credentials: 'include',
            });
          })
          .then(() => {
            // At this point, the session is invalidated server-side
  
            // ⚠️ But you may still need to clear the cookie manually (some browsers may ignore Set-Cookie in fetch)
            document.cookie = 'ory_kratos_session=; Max-Age=0; path=/; domain=.daybook.cloud; secure; SameSite=None';
  
            // Now continue to Hydra logout or redirect
            this.store.dispatch(AuthActions.logoutHydra());
          })
          .catch(err => {
            console.error('Error during Kratos logout via fetch', err);
            this.store.dispatch(AuthActions.logoutHydra()); // Fallback
          });
      })
    ),
    { dispatch: false }
  );
  
  /** Start logout (redirect to IdP logout) */
  logoutHydra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutHydra),
      tap(() => {
        getUserManager().signoutRedirect();
      })
    ),
    { dispatch: false }
  );

  /** Handle logout callback (optional) */
  handleLogoutCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleLogoutCallback),
      switchMap(() =>
        from(getUserManager().signoutRedirectCallback()).pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(err => of(AuthActions.logoutFailure({ error: err.message })))
        )
      )
    )
  );

  /** Optionally, on loginSuccess, redirect to returnUri or home */
  loginSuccessRedirect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      withLatestFrom(toObservable(this.authStore.returnUri)),
      filter(([, returnUri]) => Boolean(returnUri)),
      map(([, returnUri]) => AuthActions.performRedirect({ returnUri: returnUri! }))
    )
  );
  

  performRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.performRedirect),
        tap(({ returnUri }) => {
          this.router.navigateByUrl(returnUri);
          this.store.dispatch(AuthActions.setReturnUri({ returnUri: null }));
        })
      ),
    { dispatch: false }
  );

  setReturnUri$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.setReturnUri),
        tap(({ returnUri }) => {
          this.authStore.setReturnUri(returnUri);
          if (returnUri) {
            localStorage.setItem('returnUri', returnUri);
          }else{
            this.authStore.setReturnUri(null);
          }
        })
      ),
    { dispatch: false }
  );
  silentRenew$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.silentRenew),
      switchMap(() =>
        from(getUserManager().signinSilent()).pipe(
          map(user => user ? AuthActions.silentRenewSuccess({ user }) : AuthActions.silentRenewFailure({ error: 'No user found' })),
          catchError(error => of(AuthActions.silentRenewFailure({ error })))
        )
      )
    )
  );

}
