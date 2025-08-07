import { effect, inject, Injectable } from '@angular/core';
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


@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);
  private readonly configStore = inject(ConfigStore);
  private readonly authStore = inject(AuthStore);

  hydrateReturnUri$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ROOT_EFFECTS_INIT),
        tap(() => {
          const returnUri = localStorage.getItem('returnUri');
          this.authStore.setReturnUri(returnUri);
        })
      ),
    { dispatch: false }
  );

  /** Initialize OIDC client after config is loaded */
  initializeAuth$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.initialize),
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
      ofType(authActions.login),
      tap(({ returnUri }) => {
        const uri = returnUri ?? (window.location.pathname + window.location.search);
        this.authStore.setReturnUri(uri); // ✅ signal store + localStorage
        getUserManager().signinRedirect();
      })
    ),
    { dispatch: false }
  );

  /** Handle OIDC redirect/callback */
  handleCallback$ = createEffect(() =>
    this.actions$.pipe(
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
    )
  );
  
  loginFailure$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loginFailure),
      tap(() => {
        this.router.navigate(['/auth/login-failure']);
      })
    )
  );

  logoutKratos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.logoutKratos),
      map(() => this.configStore.config()),
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
    )
  );
  
  
  /** Start logout (redirect to IdP logout) */
  logoutHydra$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.logoutHydra),
      tap(() => {
        getUserManager().signoutRedirect();
      })
    ),
    { dispatch: false }
  );

  /** Handle logout callback (optional) */
  handleLogoutCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.handleLogoutCallback),
      switchMap(() =>
        from(getUserManager().signoutRedirectCallback()).pipe(
          map(() => authActions.logoutSuccess()),
          catchError(err => of(authActions.logoutFailure({ error: err.message })))
        )
      )
    )
  );

  /** Optionally, on loginSuccess, redirect to returnUri or home */
  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.loginSuccess),
      withLatestFrom(toObservable(this.authStore.returnUri)),
      filter(([, returnUri]) => Boolean(returnUri)),
      map(([, returnUri]) => authActions.performRedirect({ returnUri: returnUri! }))
    )
  );
  
  performRedirect$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(authActions.performRedirect),
        tap(({ returnUri }) => {
          this.router.navigateByUrl(returnUri);
          this.authStore.setReturnUri(null); // ✅ signal + localStorage handled
        })
      ),
    { dispatch: false }
  );

  silentRenew$ = createEffect(() =>
    this.actions$.pipe(
      ofType(authActions.silentRenew),
      switchMap(() =>
        from(getUserManager().signinSilent()).pipe(
          map(user => user ? authActions.silentRenewSuccess({ user }) : authActions.silentRenewFailure({ error: 'No user found' })),
          catchError(error => of(authActions.silentRenewFailure({ error })))
        )
      )
    )
  );

}
