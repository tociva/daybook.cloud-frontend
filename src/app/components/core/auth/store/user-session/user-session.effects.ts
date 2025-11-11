import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { AuthStatus } from '../auth/auth.model';
import { AuthStore } from '../auth/auth.store';
import { ConfigStore } from '../config/config.store';
import { userSessionActions } from './user-session.actions';
import { UserSession } from './user-session.model';
import { UserSessionStore } from './user-session.store';

export const userSessionEffects = {

  createUserSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.createUserSession),
        mergeMap(() =>
          http.post<UserSession>(`${getBaseUrl()}`, {}).pipe(
            map((session) => userSessionActions.createUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.createUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

  selectOrganization: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.selectOrganization),
        mergeMap(({ organizationid }) =>
          http.post<UserSession>(`${getBaseUrl()}/select-organization`, { organizationid }).pipe(
            map((session) => userSessionActions.createUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.createUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

  selectBranch: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.selectBranch),
        mergeMap(({ branchid }) =>
          http.post<UserSession>(`${getBaseUrl()}/select-branch`, { branchid }).pipe(
            map((session) => userSessionActions.createUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.createUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

  selectFiscalYear: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.selectFiscalYear),
        mergeMap(({ fiscalyearid }) =>
          http.post<UserSession>(`${getBaseUrl()}/select-fiscal-year`, { fiscalyearid }).pipe(
            map((session) => userSessionActions.createUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.createUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

  createUserSessionSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const userSessionStore = inject(UserSessionStore);
      const authStore = inject(AuthStore);
      
      return actions$.pipe(
        ofType(userSessionActions.createUserSessionSuccess),
        tap(({ session }) => {
          // 1) Update the SignalStore first so components see it immediately
          userSessionStore.setSession(session);
          authStore.setStatus(AuthStatus.AUTHENTICATED_VALID_USER);
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  clearUserSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.clearUserSession),
        mergeMap(() =>
          http.delete<void>(getBaseUrl()).pipe(
            map(() => userSessionActions.clearUserSessionSuccess()),
            catchError((error) => of(userSessionActions.clearUserSessionFailure({ error })))
          )
        )
      );
    },
    { functional: true }
  ),

  clearUserSessionFailure: createEffect(
    () => {
      const actions$ = inject(Actions);
      const router = inject(Router);

      return actions$.pipe(
        ofType(userSessionActions.clearUserSessionFailure),
        tap(({ error }) => {
          router.navigate(['/auth/logout'],{ queryParams: { error: encodeURIComponent(JSON.stringify(error)) } });
        })
      );
    },
    { functional: true, dispatch: false }
  ),
};
