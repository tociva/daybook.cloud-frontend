import { createReducer, on } from '@ngrx/store';
import * as SubscriptionActions from './subscription.actions';
import { Subscription } from './subscription.models';

export interface SubscriptionState {
  subscriptions: Subscription[];
  count: number;
  error: any;
}

export const initialState: SubscriptionState = {
  subscriptions: [],
  count: 0,
  error: null,
};

export const subscriptionReducer = createReducer(
  initialState,
  on(SubscriptionActions.loadSubscriptionsSuccess, (state, { subscriptions, count }) => ({
    ...state,
    subscriptions,
    count,
    error: null,
  })),
  on(SubscriptionActions.loadSubscriptionsFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
