import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { User, UserManager } from 'oidc-client-ts';
import { catchError, filter, from, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { selectConfig } from '../../../config/store/config.selectors';
import { getUserManager, isUserManagerInitialized, setUserManager } from '../../user-manager-singleton';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);

  private config$ = this.store.select(selectConfig);

  hydrateReturnUri$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => {
        const returnUri = localStorage.getItem('returnUri');
        return AuthActions.setReturnUri({ returnUri });
      })
    )
  );

  hydrateSessionUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.setIsInitialized),
      switchMap(() => from(getUserManager().getUser())),
      map(user =>
        user && !user.expired
          ? [AuthActions.loginSuccess({ user }), AuthActions.setIsHydrated({ isHydrated: true })]
          : [AuthActions.logoutSuccess(), AuthActions.setIsHydrated({ isHydrated: true })]
      ),
      switchMap(actions => actions)
    )
  );

  /** Initialize OIDC client after config is loaded */
  initializeAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initializeAuth),
      withLatestFrom(this.config$),
      filter(([_, config]) => !!config),
      tap(([_, config]) => {
        // Init UserManager only once!
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
          });
  
          // Bind events to NgRx actions
          manager.events.addUserLoaded((user: User) => {
            this.store.dispatch(AuthActions.setIsAuthenticated({ isAuthenticated: true }));
          });
          manager.events.addUserUnloaded(() => {
            this.store.dispatch(AuthActions.logoutSuccess());
            this.store.dispatch(AuthActions.setIsAuthenticated({ isAuthenticated: false }));
          });
          manager.events.addSilentRenewError(error => {
            this.store.dispatch(AuthActions.setError({ error: error.message }));
          });
          manager.events.addAccessTokenExpiring(() => {
            this.store.dispatch(AuthActions.silentRenew());
          });
  
          // Set the singleton instance
          setUserManager(manager);
        }
      }),
      // Now, mark as initialized
      map(action => {
        // Always set isInitialized to true after handling user state
        return AuthActions.setIsInitialized({ isInitialized: true });
      })
    )
  );

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
  

  logoutKratos$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutKratos),
      withLatestFrom(this.config$),
      tap(([_, config]) => {
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
      withLatestFrom(this.store.select(state => state.auth.returnUri)),
      filter(([_, returnUri]) => !!returnUri),
      map(([_, returnUri]) => AuthActions.performRedirect({ returnUri }))
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
          if (returnUri) {
            localStorage.setItem('returnUri', returnUri);
          }else{
            localStorage.removeItem('returnUri');
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
