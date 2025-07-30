import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SubscriptionState } from './subscription.reducer';

export const selectSubscriptionState = createFeatureSelector<SubscriptionState>('subscription');

export const selectSubscriptions = createSelector(
  selectSubscriptionState,
  (state) => state.subscriptions
);

export const selectSubscriptionsCount = createSelector(
  selectSubscriptionState,
  (state) => state.count
);

export const selectSubscriptionError = createSelector(
  selectSubscriptionState,
  (state) => state.error
);
