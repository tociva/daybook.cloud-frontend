import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { ConfigModel } from './config.model';

export const configActions = createActionGroup({
  source: 'Config',
  events: {
    load: emptyProps(),
    loadSuccess: props<{ config: ConfigModel }>(),
    loadFailure: props<{ error: any }>()
  }
});
