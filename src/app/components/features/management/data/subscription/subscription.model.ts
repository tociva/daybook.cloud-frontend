export type SubscriptionStatus = 'active' | 'canceled' | 'pending' | 'expired' | 'pastdue';

export interface Subscription {
  id?: string;
  name: string;
  description?: string;
  externalplanid?: string;
  status?: SubscriptionStatus;
  startdate: Date;
  enddate: Date;
  createdat?: Date;
  updatedat?: Date;
  props?: unknown;
  subscriptionplanid: string;
  userid: string;
}

