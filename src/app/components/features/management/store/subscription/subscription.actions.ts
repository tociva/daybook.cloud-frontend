import { createActionGroup, props } from '@ngrx/store';
import { Subscription } from './subscription.model';

export const subscriptionActions = createActionGroup({
  source: 'Subscription',
  events: {
    loadSubscriptions: props<{ query?: any }>(),
    loadSubscriptionsSuccess: props<{ subscriptions: Subscription[], count: number }>(),
    loadSubscriptionsFailure: props<{ error: any }>()
  }
});
