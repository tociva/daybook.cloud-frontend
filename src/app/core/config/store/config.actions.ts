import { createAction, props } from '@ngrx/store';
import { ConfigModel } from './config.model';

export const loadConfig = createAction('[Config] Load Config');
export const loadConfigSuccess = createAction('[Config] Load Config Success', props<{ config: ConfigModel }>());
export const loadConfigFailure = createAction('[Config] Load Config Failure', props<{ error: any }>());
