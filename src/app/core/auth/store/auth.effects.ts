// auth.effects.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { UserManager, UserManagerSettings, WebStorageStateStore, User } from 'oidc-client-ts';
import { BehaviorSubject, of, timer, EMPTY, fromEvent, from } from 'rxjs';
import { 
  filter, 
  map, 
  switchMap, 
  withLatestFrom, 
  catchError, 
  tap,
  takeUntil,
  startWith,
  debounceTime
} from 'rxjs/operators';
import { loadConfigSuccess } from '../../config/store/config.actions';
import * as AuthActions from './auth.actions';
import { AuthState } from './auth.state';

@Injectable()
export class AuthEffects {
  private userManager$ = new BehaviorSubject<UserManager | null>(null);
  private destroy$ = new BehaviorSubject<boolean>(false);

  constructor(
    private actions$: Actions,
    private store: Store<{ auth: AuthState }>,
    private router: Router
  ) {}

  // Initialize UserManager when config is loaded
  initUserManager$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadConfigSuccess),
      map(({ config }) => {
        const settings: UserManagerSettings = {
          authority: config.auth.authority,
          client_id: config.auth.clientId,
          redirect_uri: config.auth.redirectUri,
          silent_redirect_uri: config.auth.silentRedirectUri,
          post_logout_redirect_uri: config.auth.postLogoutRedirectUri,
          response_type: 'code',
          scope: config.auth.scope,
          userStore: new WebStorageStateStore({ store: window.localStorage }),
          
          // Session & Token Management
          automaticSilentRenew: true,
          includeIdTokenInSilentRenew: true,
          loadUserInfo: true,
          monitorSession: true,
          //  checkSessionInterval: 2000,
          //  accessTokenExpiringNotificationTime: 300, // 5 minutes
          // code_challenge_method: 'S256'
        };

        const userManager = new UserManager(settings);
        this.setupUserManagerEvents(userManager);
        this.userManager$.next(userManager);

        return AuthActions.initializeAuth();
      })
    )
  );

  // Initialize authentication state
  initializeAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initializeAuth),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.getUser()).pipe(
          map(user => {
            if (user && !user.expired) {
              return AuthActions.initializeAuthSuccess({ user });
            } else if (user && user.expired) {
              // Try silent renewal for expired tokens
              return AuthActions.silentRenewal();
            } else {
              return AuthActions.initializeAuthSuccess({ user: null });
            }
          }),
          catchError(error => of(AuthActions.initializeAuthFailure({ 
            error: error.message || 'Failed to initialize authentication' 
          })))
        )
      )
    )
  );

  // Handle login redirect
  loginRedirect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginRedirect),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.signinRedirect()).pipe(
          map(() => AuthActions.login()),
          catchError(error => of(AuthActions.loginFailure({ 
            error: error.message || 'Login redirect failed' 
          })))
        )
      )
    )
  );

  // Handle OAuth callback
  handleCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallback),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.signinRedirectCallback()).pipe(
          map(user => {
            const returnUrl = localStorage.getItem('returnUrl') || '/dashboard';
            localStorage.removeItem('returnUrl');
            return AuthActions.handleCallbackSuccess({ user, returnUrl });
          }),
          catchError(error => of(AuthActions.handleCallbackFailure({ 
            error: error.message || 'Callback handling failed' 
          })))
        )
      )
    )
  );

  // Navigate after successful callback
  navigateAfterCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleCallbackSuccess),
      tap(({ returnUrl }) => {
        this.router.navigateByUrl(returnUrl || '/dashboard');
      })
    ),
    { dispatch: false }
  );

  // Handle silent callback
  handleSilentCallback$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.handleSilentCallback),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.signinSilentCallback()).pipe(
          map(() => ({ type: 'SILENT_CALLBACK_SUCCESS' })), // No-op action
          catchError(error => {
            console.error('Silent callback error:', error);
            return EMPTY; // Don't dispatch error for silent callbacks
          })
        )
      )
    ),
    { dispatch: false }
  );

  // Handle silent token renewal
  silentRenewal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.silentRenewal),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.signinSilent()).pipe(
          map(user => AuthActions.silentRenewalSuccess({ user: user! })),
          catchError(error => {
            console.error('Silent renewal failed:', error);
            return of(AuthActions.silentRenewalFailure({ 
              error: error.message || 'Silent renewal failed' 
            }));
          })
        )
      )
    )
  );

  // Handle token expiration
  tokenExpired$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.tokenExpired),
      map(() => AuthActions.loginRedirect())
    )
  );

  // Handle logout
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) =>
        from(userManager!.signoutRedirect()).pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(error => of(AuthActions.logoutFailure({ 
            error: error.message || 'Logout failed' 
          })))
        )
      )
    )
  );

  // Monitor user activity for session management
  monitorActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initializeAuthSuccess),
      switchMap(() =>
        fromEvent(document, 'click').pipe(
          startWith(null),
          debounceTime(1000),
          takeUntil(this.destroy$),
          map(() => AuthActions.checkSession())
        )
      )
    )
  );

  private setupUserManagerEvents(userManager: UserManager): void {
    // User loaded (successful login or token refresh)
    userManager.events.addUserLoaded((user: User) => {
      console.log('User loaded:', user);
      this.store.dispatch(AuthActions.userLoaded({ user }));
    });

    // User unloaded (logout or session end)
    userManager.events.addUserUnloaded(() => {
      console.log('User unloaded');
      this.store.dispatch(AuthActions.userUnloaded());
    });

    // Token expiring soon
    userManager.events.addAccessTokenExpiring(() => {
      console.log('Access token expiring...');
      this.store.dispatch(AuthActions.tokenExpiring());
    });

    // Token expired
    userManager.events.addAccessTokenExpired(() => {
      console.log('Access token expired');
      this.store.dispatch(AuthActions.tokenExpired());
    });

    // Silent renewal error
    userManager.events.addSilentRenewError((error) => {
      console.error('Silent renew error:', error);
      this.store.dispatch(AuthActions.silentRenewalFailure({ 
        error: error.message || 'Silent renewal error' 
      }));
    });

    // Session terminated
    userManager.events.addUserSessionChanged(() => {
      console.log('User session changed');
      this.store.dispatch(AuthActions.sessionChanged());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}