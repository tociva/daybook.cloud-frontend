import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import * as SubscriptionActions from './subscription.actions';
import { ConfigService } from '../../../../core/config/config.service';
import { buildLoopbackFilterParams, buildLoopbackWhereParams } from '../../../../util/http-params-builder';
import { Subscription } from './subscription.models';

@Injectable()
export class SubscriptionEffects {
  private baseUrl: string = '';

  constructor(private actions$: Actions, private http: HttpClient, private configService: ConfigService) {}

  private getBaseUrl(): string {
    if (!this.baseUrl) {
      this.baseUrl = `${this.configService.apiBaseUrl}/subscription/subscription`;
    }
    return this.baseUrl;
  }

  loadSubscriptions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubscriptionActions.loadSubscriptions),
      mergeMap(({ query }) => {
        const searchFields = ['name', 'status'];
        const filterParams = buildLoopbackFilterParams(query, searchFields);
        const whereParams = buildLoopbackWhereParams(query, searchFields);

        return this.http.get<Subscription[]>(this.getBaseUrl(), { params: filterParams }).pipe(
          switchMap(data =>
            this.http.get<{ count: number }>(`${this.getBaseUrl()}/count`, { params: whereParams }).pipe(
              map(res => SubscriptionActions.loadSubscriptionsSuccess({ subscriptions: data, count: res.count }))
            )
          ),
          catchError(error => of(SubscriptionActions.loadSubscriptionsFailure({ error })))
        );
      })
    )
  );
}
