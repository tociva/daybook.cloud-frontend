import type { Ledger } from './ledger.model';

export type LedgerState = Readonly<{
  ledger: Readonly<{
    catalog: readonly Ledger[];
    catalogLoaded: boolean;
    catalogTotalCount: number;
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Ledger[];
    selectedItem: Ledger | null;
  }>;
}>;

export const initialLedgerState: LedgerState = {
  ledger: {
    catalog: [],
    catalogLoaded: false,
    catalogTotalCount: 0,
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
