import type { Branch } from './branch.model';

export type BranchState = Readonly<{
  branches: readonly Branch[];
  selectedBranchId: string | null;
  organizationId: string | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialBranchState: BranchState = {
  branches: [],
  selectedBranchId: null,
  organizationId: null,
  isLoading: false,
  error: null,
  search: '',
};

