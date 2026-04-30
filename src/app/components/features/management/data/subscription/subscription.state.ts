import type { Subscription } from './subscription.model';

export type SubscriptionState = Readonly<{
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
}>;

export const initialSubscriptionState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
};

