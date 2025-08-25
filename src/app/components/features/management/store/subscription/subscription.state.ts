import { Subscription } from './subscription.model';
import { BaseListModel } from '../../../../../util/store/base-list/base-list.model';
import { createInitialBaseListState } from '../../../../../util/store/base-list/base-list.initial';

export type SubscriptionModel = BaseListModel<Subscription>;

export const initialSubscriptionState: SubscriptionModel = createInitialBaseListState<Subscription>();