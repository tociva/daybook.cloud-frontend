import type {
  InventoryLedgerEntityType,
  InventoryLedgerType,
} from '../../data/inventory-ledger-map';

export const entityTypeOptions: readonly {
  label: string;
  value: InventoryLedgerEntityType;
}[] = [
  { label: 'Customer', value: 'customer' },
  { label: 'Vendor', value: 'vendor' },
  { label: 'Item', value: 'item' },
  { label: 'Tax', value: 'tax' },
  { label: 'Bank & Cash', value: 'bankCash' },
  { label: 'System', value: 'system' },
];

export const ledgerTypeOptions: readonly { label: string; value: InventoryLedgerType }[] = [
  { label: 'Sale', value: 'sale' },
  { label: 'Purchase', value: 'purchase' },
  { label: 'Sales Return', value: 'salesReturn' },
  { label: 'Purchase Return', value: 'purchaseReturn' },
  { label: 'Receipt', value: 'receipt' },
  { label: 'Payment', value: 'payment' },
  { label: 'Output Tax', value: 'outputTax' },
  { label: 'Input Tax', value: 'inputTax' },
  { label: 'Round Off', value: 'roundOff' },
  { label: 'Discount Allowed', value: 'discountAllowed' },
  { label: 'Discount Received', value: 'discountReceived' },
  { label: 'Bank', value: 'bank' },
  { label: 'Cash', value: 'cash' },
];

export const INVENTORY_LEDGER_TYPES_BY_ENTITY: Readonly<
  Record<InventoryLedgerEntityType, readonly InventoryLedgerType[]>
> = {
  customer: [],
  vendor: [],
  item: ['sale', 'purchase'],
  tax: ['outputTax', 'inputTax'],
  bankCash: [],
  system: ['roundOff', 'discountAllowed'],
};

export function formatInventoryLedgerEntityType(value: string | null | undefined): string {
  return entityTypeOptions.find((option) => option.value === value)?.label ?? value ?? '';
}

export function formatInventoryLedgerType(value: string | null | undefined): string {
  if (!value || value === 'general') return '';
  return ledgerTypeOptions.find((option) => option.value === value)?.label ?? value;
}
