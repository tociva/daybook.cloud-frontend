import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { UserSession } from './user-session.model';
import { initialUserSessionState } from './user-session.state';

export const UserSessionStore = signalStore(
  { providedIn: 'root' },
  withState(initialUserSessionState),
  withComputed(({ userSession }) => ({
    error: computed(() => userSession().error),
    hasOwnOrganizations: computed(() => Boolean(userSession().session?.ownorgs?.length)),
    isLoading: computed(() => userSession().isLoading),
    session: computed(() => userSession().session),
  })),
  withMethods((store) => ({
    resetSession(): void {
      patchState(store, initialUserSessionState);
    },
    setError(error: string): void {
      patchState(store, (state) => ({
        userSession: {
          ...state.userSession,
          error,
          isLoading: false,
        },
      }));
    },
    setLoading(): void {
      patchState(store, (state) => ({
        userSession: {
          ...state.userSession,
          error: null,
          isLoading: true,
        },
      }));
    },
    setSession(session: UserSession): void {
      patchState(store, {
        userSession: {
          error: null,
          isLoading: false,
          session,
        },
      });
    },
  })),
);
