import type { InventoryLedgerMap } from './inventory-ledger-map.model';

export type InventoryLedgerMapState = Readonly<{
  inventoryLedgerMap: {
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly InventoryLedgerMap[];
    selectedItem: InventoryLedgerMap | null;
  };
}>;

export const initialInventoryLedgerMapState: InventoryLedgerMapState = {
  inventoryLedgerMap: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};

