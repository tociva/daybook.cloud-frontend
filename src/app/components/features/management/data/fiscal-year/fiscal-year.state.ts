import type { FiscalYear } from './fiscal-year.model';

export type FiscalYearState = Readonly<{
  fiscalYears: readonly FiscalYear[];
  selectedFiscalYear: FiscalYear | null;
  selectedFiscalYearId: string | null;
  branchId: string | null;
  count: number;
  isLoading: boolean;
  error: string | null;
  search: string;
}>;

export const initialFiscalYearState: FiscalYearState = {
  fiscalYears: [],
  selectedFiscalYear: null,
  selectedFiscalYearId: null,
  branchId: null,
  count: 0,
  isLoading: false,
  error: null,
  search: '',
};
