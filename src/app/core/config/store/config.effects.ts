import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import * as ConfigActions from './config.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ConfigModel } from './config.model';

@Injectable()
export class ConfigEffects {
  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ConfigActions.loadConfig),
      mergeMap(() =>this.http.get<ConfigModel>('/config/config.json').pipe(
          map((config) => ConfigActions.loadConfigSuccess({ config })),
          catchError(error => of(ConfigActions.loadConfigFailure({ error }))),
        )
      )
    )
  );

  constructor(private actions$: Actions, private http: HttpClient) {}
}
