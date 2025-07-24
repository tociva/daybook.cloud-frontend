// store/auth.effects.ts

import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { selectConfig } from '../../config/store/config.selectors';
import { UserManager, User } from 'oidc-client-ts';
import { Router } from '@angular/router';
import { filter, map, switchMap, catchError, withLatestFrom, tap, of, from } from 'rxjs';
import { getUserManager, isUserManagerInitialized, setUserManager } from '../user-manager-singleton';

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
          ? AuthActions.loginSuccess({ user })
          : AuthActions.logoutSuccess()
      )
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
            post_logout_redirect_uri: config.auth.postLogoutRedirectUri,
            scope: config.auth.scope,
            response_type: 'code',
          });
  
          // Bind events to NgRx actions
          manager.events.addUserLoaded((user: User) => {
            this.store.dispatch(AuthActions.loginSuccess({ user }));
            this.store.dispatch(AuthActions.setIsAuthenticated({ isAuthenticated: true }));
          });
          manager.events.addUserUnloaded(() => {
            this.store.dispatch(AuthActions.logoutSuccess());
            this.store.dispatch(AuthActions.setIsAuthenticated({ isAuthenticated: false }));
          });
          manager.events.addSilentRenewError(error => {
            this.store.dispatch(AuthActions.setError({ error: error.message }));
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
      tap(() => {
        getUserManager().signinRedirect();
      })
    ),
    { dispatch: false }
  );

  /** Handle OIDC redirect/callback */
  handleCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallback), // You must dispatch this after the OIDC callback route!
      switchMap(() =>
        from(getUserManager().signinRedirectCallback()).pipe(
          map(user => AuthActions.loginSuccess({ user })),
          catchError(err => of(AuthActions.loginFailure({ error: err.message })))
        )
      )
    )
  );

  /** Start logout (redirect to IdP logout) */
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
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
      tap(([_, returnUri]) => {
        this.router.navigateByUrl(returnUri || '/');
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
          }
        })
      ),
    { dispatch: false }
  );
  
}
