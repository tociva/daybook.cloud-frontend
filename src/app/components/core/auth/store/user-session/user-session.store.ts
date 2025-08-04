import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  patchState,
} from '@ngrx/signals';
import { UserSession } from './user-session.model';
import {
  UserSessionState,
  initialUserSessionState,
} from './user-session.state';

export const UserSessionStore = signalStore(
  { providedIn: 'root' },

  withState<UserSessionState>(initialUserSessionState),

  withComputed((state) => ({
    session: () => state.session(),
    error: () => state.error(),

    // Convenience accessors
    isLoggedIn: () => !!state.session(),
    userId: () => state.session()?.userid ?? null,
    userEmail: () => state.session()?.email ?? null,
    organization: () => state.session()?.organization ?? null,
    branch: () => state.session()?.branch ?? null,
    fiscalYear: () => state.session()?.fiscalyear ?? null,
    subscription: () => state.session()?.subscription ?? null,
  })),

  withMethods((store) => ({
    setSession(session: UserSession) {
      patchState(store, { session, error: null });
    },

    clearSession() {
      patchState(store, { session: null, error: null });
    },

    setError(error: unknown) {
      patchState(store, { error });
    },

    reset() {
      patchState(store, initialUserSessionState);
    },
  }))
);
