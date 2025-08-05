import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, mergeMap, of, tap } from 'rxjs';
import { loadCountries } from './country.action';
import { Country } from './country.model';
import { CountryStore } from './country.store';

@Injectable()
export class CountryEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);
  private readonly countryStore = inject(CountryStore); // ✅ correct way for signalStore

  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCountries),
      mergeMap(() =>
        this.http.get<Country[]>('/assets/country-list.json').pipe(
          tap((countries) => {
            this.countryStore.setState((state) => ({
              ...state,
              countries: countries,
              loaded: true,
              error: null
            }));
          }),
          catchError((error) => {
            this.countryStore.setState((state) => ({
              ...state,
              loaded: false,
              error
            }));
            console.error('[CountryEffects] country load failed:', error);
            return of(); // or return EMPTY;
          })
        )
      )
    ),
    { dispatch: false } // ✅ no reducer dispatch needed
  );
  

}

