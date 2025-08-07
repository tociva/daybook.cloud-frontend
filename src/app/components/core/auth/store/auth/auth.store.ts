import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { AuthModel, AuthStatus } from './auth.model';
import { initialAuthState } from './auth.state';
import { User } from 'oidc-client-ts';
import { JwtUser } from '../../../../../util/token-payload.type';

export const AuthStore = signalStore(
  { providedIn: 'root' },

  withState<AuthModel>(initialAuthState),

  withComputed((state) => ({
    // Use this if you want to guard routes based on login + session restored
    isLoggedInAndHydrated: () =>
      state.status() === 'authenticated' || state.status() === 'hydrated',

    // Useful for error banners or fallback routes
    hasAuthError: () => state.status() === 'error' && !!state.error(),

    // Useful for app.component to know when hydration is complete
    isHydrationComplete: () =>
      ['authenticated', 'hydrated', 'unauthenticated', 'error'].includes(
        state.status()
      ),
    
    currentUser: () => {
      const user = state.user();
      return user?.profile?.['user'] as JwtUser | null;
    }
  })),

  withMethods((store) => ({
    setStatus(status: AuthStatus) {
      patchState(store, { status });
    },

    setUser(user: User | null) {
      patchState(store, { user });
    },

    setError(error: string) {
      patchState(store, {
        error,
        status: 'error',
      });
    },

    logout() {
      patchState(store, {
        user: null,
        status: 'unauthenticated',
        error: null,
      });
    },

    resetAuth() {
      patchState(store, initialAuthState);
    },

    setReturnUri(uri: string | null) {
      patchState(store, { returnUri: uri });
      if (uri) {
        localStorage.setItem('returnUri', uri);
      } else {
        localStorage.removeItem('returnUri');
      }
    },
  }))
);
