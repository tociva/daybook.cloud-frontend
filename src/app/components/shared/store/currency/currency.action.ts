import { createActionGroup, props } from '@ngrx/store';
import { Currency } from './currency.model';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const currencyActions = createActionGroup({
  source: 'Currency',
  events: {
    loadCurrencies: props<{ query?: unknown }>(),
    loadCurrenciesSuccess: props<{ currencies: Currency[] }>(),
    loadCurrenciesFailure: props<{ error: DbcError }>(),
  },
});
