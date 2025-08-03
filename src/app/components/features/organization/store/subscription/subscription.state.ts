// subscription.state.ts
import { Subscription } from './subscription.models';
import { ListQueryParams } from '../../../../../../util/list-query-params.type';

export interface SubscriptionModel extends ListQueryParams {
  subscriptions: Subscription[];
  error: unknown | null;
  count: number;
  page: number;
}

export const initialSubscriptionState: SubscriptionModel = {
  subscriptions: [],
  error: null,
  count: 0,
  limit: 10,
  skip: 0,
  search: '',
  sort: null,
  filters: {},
  page: 1,
};
