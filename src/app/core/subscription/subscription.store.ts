import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import type { Subscription } from './subscription.model';
import { initialSubscriptionState } from './subscription.state';

export const SubscriptionStore = signalStore(
  { providedIn: 'root' },
  withState(initialSubscriptionState),
  withComputed(({ subscription, isLoading, error }) => ({
    subscription: computed(() => subscription()),
    isActive: computed(() => subscription()?.status === 'active'),
    isLoading: computed(() => isLoading()),
    error: computed(() => error()),
  })),
  withMethods((store) => ({
    clear(): void {
      patchState(store, initialSubscriptionState);
    },
    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },
    setLoading(): void {
      patchState(store, { error: null, isLoading: true });
    },
    setSubscription(subscription: Subscription | null): void {
      patchState(store, { subscription, error: null, isLoading: false });
    },
  })),
);

