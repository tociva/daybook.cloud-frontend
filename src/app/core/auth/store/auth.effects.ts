import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { UserManager, UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';
import { BehaviorSubject, from, of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { loadConfigSuccess } from '../../config/store/config.actions';
import { login, loginRedirect, logout } from './auth.actions';

@Injectable()
export class AuthEffects {

  private userManager$ = new BehaviorSubject<UserManager | null>(null);

  initUserManager$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadConfigSuccess),
      map(({ config }) => {
        // Prepare UserManager settings from config
        const settings: UserManagerSettings = {
          authority: config.auth.authority,
          client_id: config.auth.clientId,
          redirect_uri: config.auth.redirectUri,
          response_type: 'code',
          scope: config.auth.scope,
          userStore: new WebStorageStateStore({ store: window.localStorage }),
          automaticSilentRenew: false,
          silent_redirect_uri: config.auth.redirectUri,
          post_logout_redirect_uri: config.auth.redirectUri,
          loadUserInfo: true,
        };
        const userManager = new UserManager(settings);
        this.userManager$.next(userManager);

        // return from(userManager.getUser()).pipe(
        //   map(() => {
        //     this.userManager$.next(userManager);
        //     console.log('UserManager initialized successfully');
        //   }),
        //   catchError(error => {
        //     console.error('UserManager initialization failed:', error);
        //     return of();
        //   })
        // );
      })
    ),
    { dispatch: false }
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) => {
        userManager!.signinRedirect();
        return of();
      })
    ),
    { dispatch: false }
  );
  

  loginRedirect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginRedirect),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) => {
        console.log('=== LOGIN REDIRECT DEBUG ===');
      console.log('Current URL:', window.location.href);
      console.log('UserManager settings:', userManager!.settings);
      console.log('Authority:', userManager!.settings.authority);
      console.log('Redirect URI:', userManager!.settings.redirect_uri);
      console.log('Client ID:', userManager!.settings.client_id);
      
      try {
        userManager!.signinRedirect();
      } catch (error) {
        console.error('Error during signinRedirect:', error);
      }
        return of();
      })
    ),
    { dispatch: false }
  );
  

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(logout),
      withLatestFrom(this.userManager$),
      filter(([_, userManager]) => userManager !== null),
      switchMap(([_, userManager]) => {
        userManager!.signoutRedirect();
        return of();
      })
    ),
    { dispatch: false }
  );
  

  constructor(private actions$: Actions) {}
}
