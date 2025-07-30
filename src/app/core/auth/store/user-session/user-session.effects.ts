import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as UserSessionActions from './user-session.actions';
import { ConfigService } from '../../../../core/config/config.service';
import { UserSession } from './user-session.models';

@Injectable()
export class UserSessionEffects {
  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {}

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/user/user-session`;
    }
    return this.baseUrl;
  }

  

  loadUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.loadUserSession),
      mergeMap(({ userid }) =>
        this.http.get<UserSession>(`${this.getBaseUrl()}/${userid}`).pipe(
          map(session => UserSessionActions.loadUserSessionSuccess({ session })),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );

  createUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.createUserSession),
      mergeMap(() =>
        this.http.post<UserSession>(`${this.getBaseUrl()}`, {}).pipe(
          map(session => UserSessionActions.loadUserSessionSuccess({ session })),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );

  selectOrganization$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.selectOrganization),
      mergeMap(({ organizationid }) =>
        this.http.post<UserSession>(`${this.getBaseUrl()}/select-organization`, { organizationid }).pipe(
          map(session => UserSessionActions.loadUserSessionSuccess({ session })),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );

  selectBranch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.selectBranch),
      mergeMap(({ branchid }) =>
        this.http.post<UserSession>(`${this.getBaseUrl()}/select-branch`, { branchid }).pipe(
          map(session => UserSessionActions.loadUserSessionSuccess({ session })),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );

  selectFiscalYear$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.selectFiscalYear),
      mergeMap(({ fiscalyearid }) =>
        this.http.post<UserSession>(`${this.getBaseUrl()}/select-fiscal-year`, { fiscalyearid }).pipe(
          map(session => UserSessionActions.loadUserSessionSuccess({ session })),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );

  deleteUserSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserSessionActions.deleteUserSession),
      mergeMap(({ id }) =>
        this.http.delete<void>(`${this.getBaseUrl()}/${id}`).pipe(
          map(() => UserSessionActions.clearUserSession()),
          catchError(error => of(UserSessionActions.loadUserSessionFailure({ error })))
        )
      )
    )
  );
}
