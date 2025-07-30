import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as OrganizationActions from './organization.actions';
import { ConfigService } from '../../../../core/config/config.service';
import { buildLoopbackFilterParams, buildLoopbackWhereParams } from '../../../../util/http-params-builder';
import { Organization } from './organization.models';

@Injectable()
export class OrganizationEffects {
  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {}

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/organization/organization`;
    }
    return this.baseUrl;
  }

  loadOrganizations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(OrganizationActions.loadOrganizations),
      mergeMap(({ query }) => {
        const searchFields = ['name', 'email'];
        const filterParams = buildLoopbackFilterParams(query, searchFields);
        const whereParams = buildLoopbackWhereParams(query, searchFields);

        return this.http.get<Organization[]>(this.getBaseUrl(), { params: filterParams }).pipe(
          switchMap(data =>
            this.http.get<{ count: number }>(`${this.getBaseUrl()}/count`, { params: whereParams }).pipe(
              map(res => OrganizationActions.loadOrganizationsSuccess({ organizations: data, count: res.count }))
            )
          ),
          catchError(error => of(OrganizationActions.loadOrganizationsFailure({ error })))
        );
      })
    )
  );
}
