import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, of, tap } from 'rxjs';
import { configActions } from './config.actions';
import { EnvConfig } from './config.model';
import { ConfigStore } from './config.store';

export const configEffects = {
  load: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);

      return actions$.pipe(
        ofType(configActions.load),
        mergeMap(() =>
          http.get<EnvConfig>('/config/config.json').pipe(
            tap((envConfig) => {
              configStore.setState((state) => ({
                ...state,
                config: envConfig,
                loaded: true,
                error: null
              }));
            }),
            catchError((error) => {
              configStore.setState((state) => ({
                ...state,
                loaded: false,
                error
              }));
              console.error('[ConfigEffects] config load failed:', error);
              return of(); // or return EMPTY;
            })
          )
        )
      );
    },
    { functional: true, dispatch: false }
  )
};

