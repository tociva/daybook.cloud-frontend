import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { Customer } from '../customer/customer.model';
import type { Item } from '../item/item.model';
import type { Tax } from '../tax/tax.model';

// ── Embedded address shape ──────────────────────────────────────────────────

export type InvoiceAddress = Readonly<{
  name: string;
  line1: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  mobile?: string;
  email?: string;
}>;

// ── Custom / system property bags ───────────────────────────────────────────

export type SaleInvoiceCustomProperties = Readonly<{
  autoNumbering?: boolean;
  fx?: number;
  lamt?: number;
  showdiscount?: boolean;
  showdescription?: boolean;
  usebillingforshipping?: boolean;
  taxoption?: string;
  deliverystate?: string;
  [key: string]: unknown;
}>;

export type SaleInvoiceSystemProperties = Readonly<{
  journal?: string;
  [key: string]: unknown;
}>;

// ── Line-item tax ───────────────────────────────────────────────────────────

export type SaleItemTax = Readonly<{
  id?: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  saleitemid?: string;
  taxid?: string;
  tax?: Tax;
}>;

// ── Line item ───────────────────────────────────────────────────────────────

export type SaleItem = Readonly<{
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
  taxes: readonly SaleItemTax[];
  taxamount?: number;
  grandtotal: number;
  saleinvoiceid?: string;
  itemid?: string;
  item?: Item;
}>;

// ── API request shapes ──────────────────────────────────────────────────────

export type SaleInvoiceItemTaxRequest = Readonly<{
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
  taxid?: string;
}>;

export type SaleInvoiceItemRequest = Readonly<{
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
  taxes?: readonly SaleInvoiceItemTaxRequest[];
}>;

export type SaleInvoicePayload = Readonly<{
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
  billingaddress: InvoiceAddress;
  shippingaddress: InvoiceAddress;
  cprops?: SaleInvoiceCustomProperties;
  sprops?: SaleInvoiceSystemProperties;
  description?: string;
  customerid: string;
  items: readonly SaleInvoiceItemRequest[];
}>;

// ── Read model (includes embedded relations) ─────────────────────────────────

export type SaleInvoiceCurrency = Readonly<{
  code: string;
  name?: string;
  symbol?: string;
  minorunit?: number;
}>;

export type SaleInvoice = Readonly<{
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
  currency?: SaleInvoiceCurrency;
  billingaddress?: InvoiceAddress;
  shippingaddress?: InvoiceAddress;
  cprops?: SaleInvoiceCustomProperties;
  sprops?: SaleInvoiceSystemProperties;
  description?: string;
  customerid?: string;
  customer?: Customer;
  items?: readonly SaleItem[];
  branchid?: string;
}>;

// ── Query types ─────────────────────────────────────────────────────────────

export type SaleInvoiceListQuery = Lb4ListQuery;

export type SaleInvoiceGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export const SALE_INVOICE_DETAIL_INCLUDES = [
  'currency',
  'customer',
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
                scope: { include: ['taxgroup'] },
              },
            ],
          },
        },
        {
          relation: 'taxes',
          scope: { include: ['tax'] },
        },
      ],
    },
  },
] as const satisfies readonly Lb4Include[];
