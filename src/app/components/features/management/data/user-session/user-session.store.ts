import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { ApiClientService } from '../../../../../core/api/api-client.service';
import { normalizeApiError } from '../../../../../core/api/api-error.util';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
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

    const setAndThrowError = (error: unknown, fallbackMessage: string): never => {
      const apiError = normalizeApiError(error, { fallbackMessage });
      setErrorState(apiError.message);
      throw apiError;
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
          return setAndThrowError(error, 'Failed to create user session.');
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
          return setAndThrowError(error, 'Failed to select organization.');
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
          return setAndThrowError(error, 'Failed to select branch.');
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
          return setAndThrowError(error, 'Failed to select fiscal year.');
        }
      },
      async clearUserSession(): Promise<void> {
        setLoadingState();
        try {
          const baseUrl = await getUserSessionUrl();
          await api.delete<void>(baseUrl);
          resetSessionState();
        } catch (error) {
          setAndThrowError(error, 'Failed to clear user session.');
        }
      },
    };
  }),
);
