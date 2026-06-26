import type { OrganizationMember } from './organization-member.model';

export type OrganizationMemberState = Readonly<{
  members: readonly OrganizationMember[];
  selectedMember: OrganizationMember | null;
  selectedMemberId: string | null;
  count: number;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialOrganizationMemberState: OrganizationMemberState = {
  members: [],
  selectedMember: null,
  selectedMemberId: null,
  count: 0,
  isLoading: false,
  error: null,
  search: '',
};
