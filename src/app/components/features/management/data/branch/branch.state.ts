import type { Branch } from './branch.model';

export type BranchState = Readonly<{
  branches: readonly Branch[];
  selectedBranch: Branch | null;
  selectedBranchId: string | null;
  organizationId: string | null;
  count: number;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialBranchState: BranchState = {
  branches: [],
  selectedBranch: null,
  selectedBranchId: null,
  organizationId: null,
  count: 0,
  isLoading: false,
  error: null,
  search: '',
};
