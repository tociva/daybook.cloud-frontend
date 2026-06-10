import type { Lb4ListQuery } from '../../../../../shared/crud';

export const INVENTORY_LEDGER_ENTITY_TYPES = [
  'customer',
  'vendor',
  'item',
  'tax',
  'bankCash',
  'system',
] as const;

export const INVENTORY_LEDGER_TYPES = [
  'sale',
  'purchase',
  'salesReturn',
  'purchaseReturn',
  'receipt',
  'payment',
  'outputTax',
  'inputTax',
  'roundOff',
  'discountAllowed',
  'discountReceived',
  'bank',
  'cash',
] as const;

export type InventoryLedgerEntityType = (typeof INVENTORY_LEDGER_ENTITY_TYPES)[number];
export type InventoryLedgerType = (typeof INVENTORY_LEDGER_TYPES)[number];

export type InventoryLedgerMapProps = Readonly<Record<string, unknown>>;

export type InventoryLedgerMapPayload = Readonly<{
  fiscalyearid?: string;
  entitytype: InventoryLedgerEntityType;
  entityid?: string | null;
  ledgertype?: InventoryLedgerType | null;
  ledgerid: string;
  props?: InventoryLedgerMapProps;
}>;

export type InventoryLedgerMap = InventoryLedgerMapPayload &
  Readonly<{
    id?: string;
  }>;

export type InventoryLedgerMapListQuery = Lb4ListQuery;
export type InventoryLedgerMapGetQuery = Readonly<{ includes?: readonly string[] }>;
