import { createInitialBaseListState } from '../../../../../../util/store/base-list.initial';
import { BaseListModel } from '../../../../../../util/store/base-list.model';
import { Organization } from './organization.model';

export type OrganizationModel = BaseListModel<Organization>;

export const initialOrganizationState: OrganizationModel = createInitialBaseListState<Organization>();