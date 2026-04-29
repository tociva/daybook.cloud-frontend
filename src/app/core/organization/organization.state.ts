import type { Organization } from './organization.model';

export type OrganizationState = Readonly<{
  organizations: readonly Organization[];
  selectedOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialOrganizationState: OrganizationState = {
  organizations: [],
  selectedOrganizationId: null,
  isLoading: false,
  error: null,
  search: '',
};

