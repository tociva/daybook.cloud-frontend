import { Subscription } from './subscription.model';
import { BaseListModel } from '../../../../../util/store/base-list.model';
import { createInitialBaseListState } from '../../../../../util/store/base-list.initial';

export type SubscriptionModel = BaseListModel<Subscription>;

export const initialSubscriptionState: SubscriptionModel = createInitialBaseListState<Subscription>();