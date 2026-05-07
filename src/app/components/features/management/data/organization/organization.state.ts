import type { Organization } from './organization.model';

export type OrganizationState = Readonly<{
  organizations: readonly Organization[];
  selectedOrganizationId: string | null;
  selectedOrganization: Organization | null;
  count: number;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialOrganizationState: OrganizationState = {
  organizations: [],
  selectedOrganizationId: null,
  selectedOrganization: null,
  count: 0,
  isLoading: false,
  error: null,
  search: '',
};
