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
    isLoggedInAndHydrated: () => {
      const status = state.status();
      return status === AuthStatus.AUTHENTICATED || status === AuthStatus.HYDRATED_VALID_USER || status === AuthStatus.AUTHENTICATED_VALID_USER;
    },

    // Useful for error banners or fallback routes
    hasAuthError: () => state.status() === AuthStatus.ERROR && !!state.error(),

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
        status: AuthStatus.ERROR,
      });
    },

    logout() {
      patchState(store, {
        user: null,
        status: AuthStatus.UNAUTHENTICATED,
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
