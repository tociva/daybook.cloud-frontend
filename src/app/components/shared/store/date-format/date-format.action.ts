import { createActionGroup, props } from '@ngrx/store';
import { DateFormat } from './date-format.model';
import { DbcError } from '../../../../util/types/dbc-error.type';

export const dateFormatActions = createActionGroup({
  source: 'DateFormat',
  events: {
    loadDateFormats: props<{ query?: unknown }>(),
    loadDateFormatsSuccess: props<{ dateFormats: DateFormat[] }>(),
    loadDateFormatsFailure: props<{ error: DbcError }>(),
  },
});
