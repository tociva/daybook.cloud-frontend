import type { FiscalYear } from './fiscal-year.model';

export type FiscalYearState = Readonly<{
  fiscalYears: readonly FiscalYear[];
  selectedFiscalYearId: string | null;
  branchId: string | null;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialFiscalYearState: FiscalYearState = {
  fiscalYears: [],
  selectedFiscalYearId: null,
  branchId: null,
  isLoading: false,
  error: null,
  search: '',
};

