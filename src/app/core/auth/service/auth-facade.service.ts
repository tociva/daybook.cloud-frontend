import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { User } from 'oidc-client-ts';
import * as AuthActions from '../store/auth.actions';
import * as AuthSelectors from '../store/auth.selectors';
import { AuthState } from '../store/auth.state';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  
  constructor(private store: Store<{ auth: AuthState }>) {}

  // Selectors
  user$ = this.store.select(AuthSelectors.selectUser);
  isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  isLoading$ = this.store.select(AuthSelectors.selectIsLoading);
  isInitialized$ = this.store.select(AuthSelectors.selectIsInitialized);
  error$ = this.store.select(AuthSelectors.selectAuthError);
  tokenExpiring$ = this.store.select(AuthSelectors.selectTokenExpiring);
  authReady$ = this.store.select(AuthSelectors.selectAuthReady);
  
  // Token selectors
  accessToken$ = this.store.select(AuthSelectors.selectAccessToken);
  refreshToken$ = this.store.select(AuthSelectors.selectRefreshToken);
  timeUntilExpiry$ = this.store.select(AuthSelectors.selectTimeUntilExpiry);
  
  // User info selectors
  userProfile$ = this.store.select(AuthSelectors.selectUserProfile);
  userEmail$ = this.store.select(AuthSelectors.selectUserEmail);
  userName$ = this.store.select(AuthSelectors.selectUserName);
  
  // Session health
  sessionHealth$ = this.store.select(AuthSelectors.selectSessionHealth);

  // Actions
  login(): void {
    this.store.dispatch(AuthActions.loginRedirect());
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }

  handleCallback(): void {
    this.store.dispatch(AuthActions.handleCallback());
  }

  handleSilentCallback(): void {
    this.store.dispatch(AuthActions.handleSilentCallback());
  }

  refreshToken(): void {
    this.store.dispatch(AuthActions.refreshToken());
  }

  checkSession(): void {
    this.store.dispatch(AuthActions.checkSession());
  }

  // Utility methods
  getCurrentUser(): Observable<User | null> {
    return this.user$;
  }

  getAccessToken(): Observable<string | null> {
    return this.accessToken$;
  }

  isUserAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }
}