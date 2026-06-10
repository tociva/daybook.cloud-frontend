import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { StoredDocument } from '../invoice-document';
import type { Vendor } from '../vendor/vendor.model';
import type { Item } from '../item/item.model';
import type { Tax } from '../tax/tax.model';

// ── Embedded address shape ──────────────────────────────────────────────────

export type VendorAddress = Readonly<{
  name: string;
  line1: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}>;

// ── Custom / system property bags ───────────────────────────────────────────

export type PurchaseInvoiceCustomProperties = Readonly<{
  autoNumbering?: boolean;
  showdiscount?: boolean;
  showdescription?: boolean;
  taxoption?: string;
  [key: string]: unknown;
}>;

export type PurchaseInvoiceSystemProperties = Readonly<{
  journal?: string;
  [key: string]: unknown;
}>;

// ── Line-item tax ───────────────────────────────────────────────────────────

export type PurchaseItemTax = Readonly<{
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  purchaseitemid?: string;
  taxid?: string;
  tax?: Tax;
}>;

// ── Line item ───────────────────────────────────────────────────────────────

export type PurchaseItem = Readonly<{
  id?: string;
  name: string;
  displayname?: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent?: number;
  discamount?: number;
  subtotal: number;
  taxes: readonly PurchaseItemTax[];
  taxamount?: number;
  grandtotal: number;
  purchaseinvoiceid?: string;
  itemid?: string;
  item?: Item;
}>;

// ── Payment link (avoids circular import with vendor-payment) ───────────────

export type PurchaseInvoicePaymentLink = Readonly<{
  id?: string;
  amount: number;
  vendorpaymentid?: string;
  purchaseinvoiceid?: string;
}>;

// ── API request shapes ──────────────────────────────────────────────────────

export type PurchaseInvoiceItemTaxRequest = Readonly<{
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid?: string;
}>;

export type PurchaseInvoiceItemRequest = Readonly<{
  name: string;
  displayname: string;
  description?: string;
  order: number;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent?: number;
  discamount?: number;
  subtotal: number;
  taxamount?: number;
  grandtotal: number;
  itemid: string;
  taxes?: readonly PurchaseInvoiceItemTaxRequest[];
}>;

export type PurchaseInvoicePayload = Readonly<{
  number?: string;
  date: string;
  duedate: string;
  itemtotal: number;
  discount?: number;
  subtotal: number;
  tax?: number;
  roundoff?: number;
  grandtotal: number;
  currencycode: string;
  vendoraddress?: VendorAddress;
  cprops?: PurchaseInvoiceCustomProperties;
  sprops?: PurchaseInvoiceSystemProperties;
  description?: string;
  vendorid: string;
  items: readonly PurchaseInvoiceItemRequest[];
}>;

// ── Minimal journal ref (mirrors SaleInvoiceJournal) ────────────────────────

export type PurchaseInvoiceJournal = Readonly<{
  id: string;
  number: string;
}>;

// ── Read model ───────────────────────────────────────────────────────────────

export type PurchaseInvoiceCurrency = Readonly<{
  code: string;
  name?: string;
  symbol?: string;
  minorunit?: number;
}>;

export type PurchaseInvoice = Readonly<{
  id?: string;
  number?: string;
  date: string;
  duedate?: string;
  itemtotal?: number;
  discount?: number;
  subtotal?: number;
  tax?: number;
  roundoff?: number;
  grandtotal?: number;
  currencycode?: string;
  currency?: PurchaseInvoiceCurrency;
  vendoraddress?: VendorAddress;
  cprops?: PurchaseInvoiceCustomProperties;
  sprops?: PurchaseInvoiceSystemProperties;
  description?: string;
  vendorid?: string;
  vendor?: Vendor;
  items?: readonly PurchaseItem[];
  payments?: readonly PurchaseInvoicePaymentLink[];
  documentids?: readonly string[];
  documents?: readonly StoredDocument[];
  branchid?: string;
}>;

// ── Query types ──────────────────────────────────────────────────────────────

export type PurchaseInvoiceListQuery = Lb4ListQuery;

export type PurchaseInvoiceGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export const PURCHASE_INVOICE_DETAIL_INCLUDES = [
  'currency',
  'vendor',
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
  {
    relation: 'payments',
    scope: { include: [{ relation: 'vendorpayment' }] },
  },
  'documents',
] as const satisfies readonly Lb4Include[];
