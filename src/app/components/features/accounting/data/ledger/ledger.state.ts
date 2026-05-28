import { createInitialCachedCrudState, type CachedCrudState } from '../../../../../shared/crud';
import type { Ledger } from './ledger.model';

type LedgerCollectionState = CachedCrudState<Ledger> &
  Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly Ledger[];
    selectedItem: Ledger | null;
  }>;

export type LedgerState = Readonly<{
  ledger: LedgerCollectionState;
}>;

export const initialLedgerState: LedgerState = {
  ledger: {
    ...createInitialCachedCrudState<Ledger>(),
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
