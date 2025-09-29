import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, of, tap } from 'rxjs';
import { configActions } from './config.actions';
import { EnvConfig } from './config.model';
import { ConfigStore } from './config.store';
import { AuthStore } from '../auth/auth.store';
import { AuthStatus } from '../auth/auth.model';

export const configEffects = {
  load: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const configStore = inject(ConfigStore);
      const authStore = inject(AuthStore);

      return actions$.pipe(
        ofType(configActions.load),
        mergeMap(() =>
          {
            authStore.setStatus(AuthStatus.CONFIG_LOADING);
            return http.get<EnvConfig>('/config/config.json').pipe(
            tap((envConfig) => {
              configStore.setState((state) => ({
                ...state,
                config: envConfig,
                loaded: true,
                error: null
              }));
              authStore.setStatus(AuthStatus.CONFIG_LOADED);
            }),
            catchError((error) => {
              configStore.setState((state) => ({
                ...state,
                loaded: false,
                error
              }));
              authStore.setStatus(AuthStatus.CONFIG_LOAD_ERROR);
              console.error('[ConfigEffects] config load failed:', error);
              return of(); // or return EMPTY;
            })
          )
        }
        )
      );
    },
    { functional: true, dispatch: false }
  )
};

