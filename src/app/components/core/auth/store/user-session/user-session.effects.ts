import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { userSessionActions } from './user-session.actions';
import { UserSession } from './user-session.model';
import { ConfigStore } from '../config/config.store';

export const userSessionEffects = {
  loadUserSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.loadUserSession),
        mergeMap(({ userid }) =>
          http.get<UserSession>(`${getBaseUrl()}/${userid}`).pipe(
            map((session) => userSessionActions.loadUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

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
            map((session) => userSessionActions.loadUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
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
            map((session) => userSessionActions.loadUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
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
            map((session) => userSessionActions.loadUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
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
            map((session) => userSessionActions.loadUserSessionSuccess({ session })),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  ),

  loadUserSessionSuccess: createEffect(
    () => {
      const actions$ = inject(Actions);
      const router = inject(Router);

      return actions$.pipe(
        ofType(userSessionActions.loadUserSessionSuccess),
        tap(({ session }) => {
          if (!session.ownorgs || session.ownorgs.length === 0) {
            router.navigate(['/management/organization/create']);
          }
        })
      );
    },
    { functional: true, dispatch: false }
  ),

  deleteUserSession: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      const getBaseUrl = () => {
        const envConfig = configStore.config();
        return `${envConfig.apiBaseUrl}/user/user-session`;
      };

      return actions$.pipe(
        ofType(userSessionActions.deleteUserSession),
        mergeMap(({ id }) =>
          http.delete<void>(`${getBaseUrl()}/${id}`).pipe(
            map(() => userSessionActions.clearUserSession()),
            catchError((error) =>
              of(userSessionActions.loadUserSessionFailure({ error }))
            )
          )
        )
      );
    },
    { functional: true }
  )
};
