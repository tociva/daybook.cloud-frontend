import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { dateFormatActions } from './date-format.action';
import { DateFormat } from './date-format.model';
import { DateFormatStore } from './date-format.store';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const dateFormatEffects = {
  loadDateFormats: createEffect(
    () => {
      const actions$ = inject(Actions);
      const http = inject(HttpClient);
      const dateFormatStore = inject(DateFormatStore);

      return actions$.pipe(
        ofType(dateFormatActions.loadDateFormats),
        mergeMap(() =>
          http.get<DateFormat[]>('/assets/date-format-list.json').pipe(
            tap((dateFormats) => {
              dateFormatStore.setState((state) => ({
                ...state,
                dateFormats,
                loaded: true,
                error: null,
              }));
            }),
            map((dateFormats) =>
              dateFormatActions.loadDateFormatsSuccess({ dateFormats })
            ),
            catchError((error) => {
              dateFormatStore.setState((state) => ({
                ...state,
                dateFormats: [],
                loaded: false,
                error,
              }));
              console.error('[DateFormatEffects] load failed:', error);
              return of(
                dateFormatActions.loadDateFormatsFailure({
                  error: error as DbcError,
                })
              );
            })
          )
        )
      );
    },
    { functional: true }
  ),
};
