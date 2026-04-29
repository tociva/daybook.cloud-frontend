import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ApiClientService } from '../api/api-client.service';
import { AppConfigStore } from '../config/app-config.store';
import { UserSession } from './user-session.model';
import { initialUserSessionState } from './user-session.state';

type UserSessionSelectionId = number | string;

export const UserSessionStore = signalStore(
  { providedIn: 'root' },
  withState(initialUserSessionState),
  withComputed(({ userSession }) => ({
    error: computed(() => userSession().error),
    hasOwnOrganizations: computed(() => Boolean(userSession().session?.ownorgs?.length)),
    isLoading: computed(() => userSession().isLoading),
    session: computed(() => userSession().session),
  })),
  withMethods((store, api = inject(ApiClientService), appConfigStore = inject(AppConfigStore)) => {
    const getUserSessionUrl = async (): Promise<string> => {
      const config = appConfigStore.config() ?? (await appConfigStore.load());
      if (!config) {
        throw new Error('Unable to load app configuration.');
      }

      return `${config.apiBaseUrl.replace(/\/$/, '')}/user/user-session`;
    };

    const toErrorMessage = (error: unknown, fallback: string): string =>
      error instanceof Error ? error.message : fallback;

    const resetSessionState = (): void => {
      patchState(store, initialUserSessionState);
    };

    const setErrorState = (error: string): void => {
      patchState(store, (state) => ({
        userSession: {
          ...state.userSession,
          error,
          isLoading: false,
        },
      }));
    };

    const setLoadingState = (): void => {
      patchState(store, (state) => ({
        userSession: {
          ...state.userSession,
          error: null,
          isLoading: true,
        },
      }));
    };

    const setSessionState = (session: UserSession): void => {
      patchState(store, {
        userSession: {
          error: null,
          isLoading: false,
          session,
        },
      });
    };

    return {
      resetSession(): void {
        resetSessionState();
      },
      setError(error: string): void {
        setErrorState(error);
      },
      setLoading(): void {
        setLoadingState();
      },
      setSession(session: UserSession): void {
        setSessionState(session);
      },
      async createUserSession(): Promise<UserSession> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          const session = await api.post<UserSession, Record<string, never>>(baseUrl, {});
          setSessionState(session);
          return session;
        } catch (error) {
          const message = toErrorMessage(error, 'Failed to create user session.');
          setErrorState(message);
          throw new Error(message);
        }
      },
      async selectOrganization(organizationid: UserSessionSelectionId): Promise<UserSession> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          const session = await api.post<UserSession, { organizationid: UserSessionSelectionId }>(
            `${baseUrl}/select-organization`,
            { organizationid },
          );
          setSessionState(session);
          return session;
        } catch (error) {
          const message = toErrorMessage(error, 'Failed to select organization.');
          setErrorState(message);
          throw new Error(message);
        }
      },
      async selectBranch(branchid: UserSessionSelectionId): Promise<UserSession> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          const session = await api.post<UserSession, { branchid: UserSessionSelectionId }>(
            `${baseUrl}/select-branch`,
            { branchid },
          );
          setSessionState(session);
          return session;
        } catch (error) {
          const message = toErrorMessage(error, 'Failed to select branch.');
          setErrorState(message);
          throw new Error(message);
        }
      },
      async selectFiscalYear(fiscalyearid: UserSessionSelectionId): Promise<UserSession> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          const session = await api.post<UserSession, { fiscalyearid: UserSessionSelectionId }>(
            `${baseUrl}/select-fiscal-year`,
            { fiscalyearid },
          );
          setSessionState(session);
          return session;
        } catch (error) {
          const message = toErrorMessage(error, 'Failed to select fiscal year.');
          setErrorState(message);
          throw new Error(message);
        }
      },
      async clearUserSession(): Promise<void> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          await api.delete<void>(baseUrl);
          resetSessionState();
        } catch (error) {
          const message = toErrorMessage(error, 'Failed to clear user session.');
          setErrorState(message);
          throw new Error(message);
        }
      },
    };
  }),
);
