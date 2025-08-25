// organization.store.ts
import { createBaseListStore } from '../../../../../util/store/base-list/base-list.store';
import { Organization } from './organization.model';

export const OrganizationStore = createBaseListStore<Organization>('organization');
