import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { userSessionActions } from './user-session.actions';
import { UserSession } from './user-session.model';
import { ConfigStore } from '../config/config.store';

@Injectable()
export class UserSessionEffects {
  private http = inject(HttpClient);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private configStore = inject(ConfigStore);

  private get baseUrl(): string {
    const envConfig = this.configStore.config();
    return `${envConfig.apiBaseUrl}/user/user-session`;
  }

  loadUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.loadUserSession),
      mergeMap(({ userid }) =>
        this.http.get<UserSession>(`${this.baseUrl}/${userid}`).pipe(
          map((session) => userSessionActions.loadUserSessionSuccess({ session })),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      )
    )
  );

  createUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.createUserSession),
      mergeMap(() =>
        {
          return this.http.post<UserSession>(`${this.baseUrl}`, {}).pipe(
          map((session) => userSessionActions.loadUserSessionSuccess({ session })),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      }
      )
    )
  );

  selectOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.selectOrganization),
      mergeMap(({ organizationid }) =>
        this.http.post<UserSession>(`${this.baseUrl}/select-organization`, { organizationid }).pipe(
          map((session) => userSessionActions.loadUserSessionSuccess({ session })),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      )
    )
  );

  selectBranch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.selectBranch),
      mergeMap(({ branchid }) =>
        this.http.post<UserSession>(`${this.baseUrl}/select-branch`, { branchid }).pipe(
          map((session) => userSessionActions.loadUserSessionSuccess({ session })),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      )
    )
  );

  selectFiscalYear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.selectFiscalYear),
      mergeMap(({ fiscalyearid }) =>
        this.http.post<UserSession>(`${this.baseUrl}/select-fiscal-year`, { fiscalyearid }).pipe(
          map((session) => userSessionActions.loadUserSessionSuccess({ session })),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      )
    )
  );

  loadUserSessionSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(userSessionActions.loadUserSessionSuccess),
        tap(({ session }) => {
          if (!session.ownorgs || session.ownorgs.length === 0) {
            this.router.navigate(['/management/organization/create']);
          }
        })
      ),
    { dispatch: false }
  );

  deleteUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userSessionActions.deleteUserSession),
      mergeMap(({ id }) =>
        this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
          map(() => userSessionActions.clearUserSession()),
          catchError((error) =>
            of(userSessionActions.loadUserSessionFailure({ error }))
          )
        )
      )
    )
  );
}
