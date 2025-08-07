import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, of, tap } from 'rxjs';
import { configActions } from './config.actions';
import { EnvConfig } from './config.model';
import { ConfigStore } from './config.store';

@Injectable()
export class ConfigEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly configStore = inject(ConfigStore); // ✅ correct way for signalStore

  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(configActions.load),
      mergeMap(() =>
        this.http.get<EnvConfig>('/config/config.json').pipe(
          tap((envConfig) => {
            this.configStore.setState((state) => ({
              ...state,
              config: envConfig,
              loaded: true,
              error: null
            }));
          }),
          catchError((error) => {
            this.configStore.setState((state) => ({
              ...state,
              loaded: false,
              error
            }));
            console.error('[ConfigEffects] config load failed:', error);
            return of(); // or return EMPTY;
          })
        )
      )
    ),
    { dispatch: false } // ✅ no reducer dispatch needed
  );
  

}

