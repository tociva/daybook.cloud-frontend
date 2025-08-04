import { Subscription } from './subscription.model';
import { BaseListModel } from '../../../../../../util/base-list.model';
import { createInitialBaseListState } from '../../../../../../util/base-list.initial';

export type SubscriptionModel = BaseListModel<Subscription>;

export const initialSubscriptionState: SubscriptionModel = createInitialBaseListState<Subscription>();