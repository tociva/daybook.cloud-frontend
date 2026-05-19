import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { PurchaseInvoice } from '../purchase-invoice/purchase-invoice.model';
import type { Item } from '../item/item.model';
import type { Tax } from '../tax/tax.model';

// ── Custom / system property bags ───────────────────────────────────────────

export type PurchaseReturnCustomProperties = Readonly<{
  showdescription?: boolean;
  taxoption?: string;
  [key: string]: unknown;
}>;

export type PurchaseReturnSystemProperties = Readonly<{
  journal?: string;
  [key: string]: unknown;
}>;

// ── Line-item tax ───────────────────────────────────────────────────────────

export type PurchaseReturnItemTax = Readonly<{
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  purchasereturnitemid?: string;
  taxid?: string;
  tax?: Tax;
}>;

// ── Line item ───────────────────────────────────────────────────────────────

export type PurchaseReturnItem = Readonly<{
  id?: string;
  name: string;
  displayname?: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  taxes: readonly PurchaseReturnItemTax[];
  taxamount?: number;
  grandtotal: number;
  purchasereturnid?: string;
  itemid?: string;
  item?: Item;
}>;

// ── API request shapes ──────────────────────────────────────────────────────

export type PurchaseReturnItemTaxRequest = Readonly<{
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid?: string;
}>;

export type PurchaseReturnItemRequest = Readonly<{
  name: string;
  displayname: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  taxamount?: number;
  grandtotal: number;
  itemid: string;
  taxes?: readonly PurchaseReturnItemTaxRequest[];
}>;

export type PurchaseReturnPayload = Readonly<{
  number?: string;
  date: string;
  duedate: string;
  itemtotal: number;
  tax?: number;
  roundoff?: number;
  grandtotal: number;
  cprops?: PurchaseReturnCustomProperties;
  sprops?: PurchaseReturnSystemProperties;
  description?: string;
  purchaseinvoiceid: string;
  items: readonly PurchaseReturnItemRequest[];
}>;

// ── Read model ───────────────────────────────────────────────────────────────

export type PurchaseReturn = Readonly<{
  id?: string;
  number?: string;
  date: string;
  duedate?: string;
  itemtotal?: number;
  tax?: number;
  roundoff?: number;
  grandtotal?: number;
  cprops?: PurchaseReturnCustomProperties;
  sprops?: PurchaseReturnSystemProperties;
  description?: string;
  purchaseinvoiceid?: string;
  purchaseinvoice?: PurchaseInvoice;
  items?: readonly PurchaseReturnItem[];
  branchid?: string;
}>;

// ── Query types ──────────────────────────────────────────────────────────────

export type PurchaseReturnListQuery = Lb4ListQuery;

export type PurchaseReturnGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export const PURCHASE_RETURN_DETAIL_INCLUDES = [
  {
    relation: 'purchaseinvoice',
    scope: { include: [{ relation: 'vendor' }] },
  },
  {
    relation: 'items',
    scope: {
      include: [
        {
          relation: 'item',
          scope: {
            include: [
              {
                relation: 'category',
                scope: { include: [{ relation: 'taxgroup' }] },
              },
            ],
          },
        },
        {
          relation: 'taxes',
          scope: { include: [{ relation: 'tax' }] },
        },
      ],
    },
  },
] as const satisfies readonly Lb4Include[];
