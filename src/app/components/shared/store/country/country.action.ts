import { createActionGroup, props } from '@ngrx/store';
import { Country } from './country.model';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const countryActions = createActionGroup({
  source: 'Country',
  events: {
    loadCountries: props<{ query?: unknown }>(),
    loadCountriesSuccess: props<{ countries: Country[] }>(),
    loadCountriesFailure: props<{ error: DbcError }>(),
  },
});
