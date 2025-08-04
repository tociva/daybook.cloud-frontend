import { createInitialBaseListState } from '../../../../../../util/base-list.initial';
import { BaseListModel } from '../../../../../../util/base-list.model';
import { Organization } from './organization.model';

export type OrganizationModel = BaseListModel<Organization>;

export const initialOrganizationState: OrganizationModel = createInitialBaseListState<Organization>();