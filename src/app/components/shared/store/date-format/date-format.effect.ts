import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { loadDateFormats } from './date-format.action';
import { DateFormat } from './date-format.model';
import { DateFormatStore } from './date-format.store';
import { CountryStore } from '../country/country.store';

@Injectable()
export class DateFormatEffects {
  private readonly actions$ = inject(Actions);
  private readonly dateFormatStore = inject(DateFormatStore);
  private readonly countryStore = inject(CountryStore);

  loadDateFormats$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loadDateFormats),
        tap(() => {
          try {
            const countries = this.countryStore.countries();
            const uniqueDateFormats: DateFormat[] = Array.from(
              new Map(
                countries.map((c) => [c.dateFormat.name, c.dateFormat])
              ).values()
            );
            this.dateFormatStore.setState((state) => ({
              ...state,
              dateFormats: uniqueDateFormats,
              loaded: true,
              error: null
            }));
          } catch (error) {
            this.dateFormatStore.setState((state) => ({
              ...state,
              dateFormats: [],
              loaded: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }));
            console.error('[DateFormatEffects] Failed to extract date formats:', error);
          }
        })
      ),
    { dispatch: false }
  );
}
