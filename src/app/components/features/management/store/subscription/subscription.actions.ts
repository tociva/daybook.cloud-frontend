import { createAction, props } from '@ngrx/store';
import { Subscription } from './subscription.model';

export const loadSubscriptions = createAction('[Subscription] Load Subscriptions', props<{ query?: any }>());
export const loadSubscriptionsSuccess = createAction('[Subscription] Load Subscriptions Success', props<{ subscriptions: Subscription[], count: number }>());
export const loadSubscriptionsFailure = createAction('[Subscription] Load Subscriptions Failure', props<{ error: any }>());
