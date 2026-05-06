import type { Ledger } from './ledger.model';

export type LedgerState = Readonly<{
  ledger: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Ledger[];
    selectedItem: Ledger | null;
  }>;
}>;

export const initialLedgerState: LedgerState = {
  ledger: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
