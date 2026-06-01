# Bulk Upload UI Agent Instructions

This is the UI-facing contract for the backend bulk-upload endpoints currently present in the codebase. Use it to build import screens, JSON template download, client-side validation, and API calls.

## Transport Contract

All model-specific bulk uploads use the same transport:

```http
POST /<module>/<model>/bulk-upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file=<JSON file>
```

Client rules:

- Send a real `FormData` body with a single field named `file`.
- The file content must be valid JSON and the JSON root must be an object.
- Do not set the `Content-Type` header manually in browser code. Let the browser add the multipart boundary.
- Accepted file MIME types are `application/json`, `text/json`, and `application/octet-stream`.
- Max file size is `1048576` bytes, currently 1 MiB.
- The user session must already exist: `POST /user/user-session`.
- All bulk uploads require an active branch because the shared file interceptor checks branch context.
- Accounting uploads also need an active fiscal year. Call `POST /user/user-session/select-fiscal-year` with `{ "fiscalyearid": "<id>" }`.
- Branch-scoped inventory uploads need `POST /user/user-session/select-branch` with `{ "branchid": "<id>" }`.
- The server assigns `branchid`, `fiscalyearid`, generated ids, status defaults, audit fields, and most relationship ids.
- Successful responses are arrays of created model instances.
- Failed validation generally returns a 4xx response with a backend error message. Surface `error.message` to the user.

Browser example:

```ts
async function bulkUpload(endpoint: string, token: string, payload: unknown) {
  const file = new File([JSON.stringify(payload)], 'bulk-upload.json', {
    type: 'application/json',
  });
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? 'Bulk upload failed');
  }
  return body;
}
```

There is also `POST /inventory/bulk-upload`, but it only previews uploaded JSON keys. Do not use it to create model records.

## Endpoint Matrix

| Area | Model | Endpoint | Root JSON key | Backend permission check | Scope source |
| --- | --- | --- | --- | --- | --- |
| Inventory | Item | `/inventory/item/bulk-upload` | `items` | `bulkUpload` | active branch |
| Inventory | Item category | `/inventory/item-category/bulk-upload` | `itemCategory` | `bulkUpload` | active branch |
| Inventory | Tax | `/inventory/tax/bulk-upload` | `taxes` | `bulkUpload` | active branch |
| Inventory | Tax group | `/inventory/tax-group/bulk-upload` | `taxgroups` plus optional `taxes` | `bulkUpload` | active branch |
| Inventory | Customer | `/inventory/customer/bulk-upload` | `customers` | `bulkUpload` | active branch |
| Inventory | Vendor | `/inventory/vendor/bulk-upload` | `vendors` | `bulkUpload` | active branch |
| Inventory | Bank/Cash | `/inventory/bank-cash/bulk-upload` | `bankCash` | `create` | active branch |
| Inventory | Purchase invoice | `/inventory/purchase-invoice/bulk-upload` | `invoices` | `bulkUpload` | active branch |
| Inventory | Sale invoice | `/inventory/sale-invoice/bulk-upload` | `invoices` | `bulkUpload` | active branch |
| Inventory | Customer receipt | `/inventory/customer-receipt/bulk-upload` | `receipts` | `create` | active branch |
| Inventory | Vendor payment | `/inventory/vendor-payment/bulk-upload` | `payments` | `create` | active branch |
| Accounting | Ledger category | `/accounting/ledger-category/bulk-upload` | `ledgerCategory` | `bulkUpload` | active fiscal year, branch still required |
| Accounting | Ledger | `/accounting/ledger/bulk-upload` | `ledgers` | `bulkUpload` | active fiscal year, branch still required |
| Accounting | Bank transaction | `/accounting/bank-txn/bulk-upload` | `bankTxns` | `create` | active fiscal year, branch still required |
| Accounting | Journal | `/accounting/journal/bulk-upload` | `journals` | `bulkUpload` | active fiscal year, branch still required |

Currently there is no purchase-return bulk-upload endpoint.

## Shared Schema Notation

Schemas below are TypeScript-style JSON shapes. A property ending in `?` is optional. Dates should be sent as `YYYY-MM-DD`.

```ts
type Address = {
  name: string;
  line1: string;
  line2?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  mobile?: string;
  email?: string;
};

type InvoiceTaxLine = {
  name: string;       // existing Tax.name in current branch
  shortname: string;
  rate: number;
  appliedto: number;  // amount on which this tax is applied
  amount: number;
};

type InvoiceItemLine = {
  name: string;        // existing Item.name in current branch
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
  taxes?: InvoiceTaxLine[];
  taxamount?: number;
  grandtotal: number;
};
```

## Inventory Payloads

### Item

Endpoint: `POST /inventory/item/bulk-upload`

```ts
type ItemBulkUpload = {
  items: Array<{
    name: string;
    code: string;
    displayname: string;
    barcode?: string;
    description?: string;
    purchaseledger?: string;
    salesledger?: string;
    category: string; // item category name
  }>;
};
```

Example:

```json
{
  "items": [
    {
      "name": "Laptop",
      "code": "LAP-001",
      "displayname": "Laptop",
      "barcode": "890000000001",
      "description": "Business laptop",
      "purchaseledger": "Purchase Account",
      "salesledger": "Sales Account",
      "category": "Electronics"
    }
  ]
}
```

Rules:

- `category` is resolved by item-category name in the current branch.
- If a category name does not exist, the backend auto-creates it as a Product category with code derived from the name.
- Item names are unique per branch.
- `purchaseledger` and `salesledger` are stored as plain strings here. They are not resolved to accounting ledgers by this endpoint.

### Item Category

Endpoint: `POST /inventory/item-category/bulk-upload`

```ts
type ItemCategoryBulkUpload = {
  itemCategory: Array<{
    name: string;
    code: string;
    description?: string;
    type: 'Product' | 'Service';
    parent?: string;    // parent item-category name
    taxgroup?: string;  // tax-group name
  }>;
};
```

Example:

```json
{
  "itemCategory": [
    {
      "name": "Electronics",
      "code": "ELEC",
      "type": "Product",
      "description": "Electronic goods"
    },
    {
      "name": "Laptops",
      "code": "LAP",
      "type": "Product",
      "parent": "Electronics",
      "taxgroup": "GST 18%"
    }
  ]
}
```

Rules:

- `parent` is resolved by name. Parent can already exist or appear earlier in the same file hierarchy.
- Missing parent names can cause child rows to be skipped without a clear validation error. Validate parent names client-side before upload.
- `taxgroup` is resolved by tax-group name. Validate it client-side if the UI lets users choose one.
- Category names are unique per branch.

### Tax

Endpoint: `POST /inventory/tax/bulk-upload`

```ts
type TaxBulkUpload = {
  taxes: Array<{
    name: string;
    shortname: string;
    rate: number;
    appliedto: number;
    description?: string;
  }>;
};
```

Example:

```json
{
  "taxes": [
    {
      "name": "CGST 9%",
      "shortname": "CGST",
      "rate": 9,
      "appliedto": 1,
      "description": "Central GST"
    }
  ]
}
```

Rules:

- Tax names are unique per branch.
- Prefer positive `rate` and `appliedto` values in the UI.

### Tax Group

Endpoint: `POST /inventory/tax-group/bulk-upload`

```ts
type TaxGroupBulkUpload = {
  taxes?: Array<{
    name: string;
    shortname: string;
    rate: number;
    appliedto: number;
    description?: string;
  }>;
  taxgroups: Array<{
    name: string;
    rate: number;
    description?: string;
    groups?: Array<{
      mode: string;
      taxes: string[]; // tax names, not ids
    }>;
  }>;
};
```

Example:

```json
{
  "taxes": [
    {
      "name": "CGST 9%",
      "shortname": "CGST",
      "rate": 9,
      "appliedto": 1
    },
    {
      "name": "SGST 9%",
      "shortname": "SGST",
      "rate": 9,
      "appliedto": 1
    }
  ],
  "taxgroups": [
    {
      "name": "GST 18%",
      "rate": 18,
      "description": "CGST + SGST",
      "groups": [
        {
          "mode": "intra-state",
          "taxes": ["CGST 9%", "SGST 9%"]
        }
      ]
    }
  ]
}
```

Rules:

- `taxes` is optional and lets the file create missing tax rows before creating the groups.
- `groups[].taxes` must contain tax names that either already exist in the branch or are present in the same payload's `taxes`.
- Tax-group names are unique per branch.
- Do not send `taxids` in the upload JSON. The backend resolves names to ids.

### Customer

Endpoint: `POST /inventory/customer/bulk-upload`

```ts
type CustomerBulkUpload = {
  customers: Array<{
    name: string;
    mobile?: string;
    email?: string;
    gstin?: string;
    address: Address;
    countrycode: string;
    state?: string;
    currencycode: string;
    description?: string;
  }>;
};
```

Example:

```json
{
  "customers": [
    {
      "name": "Acme Retail",
      "mobile": "+91 9876543210",
      "email": "billing@acme.example",
      "gstin": "29ABCDE1234F1Z5",
      "address": {
        "name": "Acme Retail",
        "line1": "Plot 10",
        "street": "MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "zip": "560001",
        "country": "India"
      },
      "countrycode": "IN",
      "state": "Karnataka",
      "currencycode": "INR",
      "description": "Retail customer"
    }
  ]
}
```

Rules:

- `countrycode` and `currencycode` must match existing Country/Currency rows.
- Customer names are used later for sale invoice and receipt lookup. Enforce unique names in the UI even though this model currently has no unique name index.

### Vendor

Endpoint: `POST /inventory/vendor/bulk-upload`

```ts
type VendorBulkUpload = {
  vendors: Array<{
    name: string;
    mobile?: string;
    email?: string;
    gstin?: string;
    pan?: string;
    address: Address;
    countrycode: string;
    state?: string;
    currencycode: string;
    description?: string;
  }>;
};
```

Example:

```json
{
  "vendors": [
    {
      "name": "Acme Supplies",
      "email": "sales@acme-supplies.example",
      "gstin": "29ABCDE1234F1Z5",
      "pan": "ABCDE1234F",
      "address": {
        "name": "Acme Supplies",
        "line1": "Warehouse 2",
        "street": "Industrial Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "zip": "560002",
        "country": "India"
      },
      "countrycode": "IN",
      "state": "Karnataka",
      "currencycode": "INR",
      "description": "Primary supplier"
    }
  ]
}
```

Rules:

- `countrycode` and `currencycode` must match existing Country/Currency rows.
- Vendor names are used later for purchase invoice and payment lookup. Enforce unique names in the UI even though this model currently has no unique name index.

### Bank/Cash

Endpoint: `POST /inventory/bank-cash/bulk-upload`

```ts
type BankCashBulkUpload = {
  bankCash: Array<{
    name: string;
    description: string;
  }>;
};
```

Example:

```json
{
  "bankCash": [
    {
      "name": "HDFC Current Account",
      "description": "Main operating bank account"
    },
    {
      "name": "Cash in Hand",
      "description": "Petty cash"
    }
  ]
}
```

Rules:

- Bank/cash names are unique per branch.
- This endpoint does not create accounting ledgers or bank-cash ledger mappings.
- To upload bank transactions later, each bank/cash record must have a `BankCashLedgerMap` created separately through `/accounting/bank-cash-ledger-map`.

### Purchase Invoice

Endpoint: `POST /inventory/purchase-invoice/bulk-upload`

```ts
type PurchaseInvoiceBulkUpload = {
  invoices: Array<{
    number: string;
    date: string;
    duedate: string;
    currencycode: string;
    itemtotal: number;
    discount?: number;
    subtotal: number;
    tax?: number;
    roundoff?: number;
    grandtotal: number;
    vendoraddress?: Address;
    description?: string;
    vendorname: string;       // existing active Vendor.name in current branch
    items: InvoiceItemLine[]; // Item.name and Tax.name references
    taxoption?: string;
  }>;
};
```

Example:

```json
{
  "invoices": [
    {
      "number": "PI-001",
      "date": "2026-04-01",
      "duedate": "2026-04-15",
      "currencycode": "INR",
      "vendorname": "Acme Supplies",
      "itemtotal": 10000,
      "discount": 0,
      "subtotal": 10000,
      "tax": 1800,
      "roundoff": 0,
      "grandtotal": 11800,
      "items": [
        {
          "name": "Laptop",
          "displayname": "Laptop",
          "order": 1,
          "code": "LAP-001",
          "price": 10000,
          "quantity": 1,
          "itemtotal": 10000,
          "subtotal": 10000,
          "taxes": [
            {
              "name": "CGST 9%",
              "shortname": "CGST",
              "rate": 9,
              "appliedto": 10000,
              "amount": 900
            },
            {
              "name": "SGST 9%",
              "shortname": "SGST",
              "rate": 9,
              "appliedto": 10000,
              "amount": 900
            }
          ],
          "taxamount": 1800,
          "grandtotal": 11800
        }
      ],
      "taxoption": "exclusive"
    }
  ]
}
```

Rules:

- `vendorname` must match an active vendor in the current branch.
- Every `items[].name` must match an active item in the current branch.
- Every `items[].taxes[].name`, when taxes are present, must match an active tax in the current branch.
- `vendoraddress` is optional. If omitted, the backend uses the vendor's address.
- Invoice number uniqueness is `(number, branch, vendor)`.
- The backend stores dates from `date` and `duedate` as date values.
- The current bulk path resolves relations but does not perform the same total math checks as sale invoices. Validate item totals, discounts, taxes, and grand total client-side.

### Sale Invoice

Endpoint: `POST /inventory/sale-invoice/bulk-upload`

```ts
type SaleInvoiceBulkUpload = {
  invoices: Array<{
    number: string;
    date: string;
    duedate: string;
    currencycode: string;     // required by payload type, persisted from customer
    itemtotal: number;
    discount?: number;
    subtotal: number;
    tax?: number;
    roundoff?: number;
    grandtotal: number;
    billingaddress: Address;
    shippingaddress: Address;
    description?: string;
    customername: string;     // existing active Customer.name in current branch
    items: InvoiceItemLine[]; // Item.name and Tax.name references
    deliverystate?: string;
    taxoption?: string;
  }>;
};
```

Example:

```json
{
  "invoices": [
    {
      "number": "SI-001",
      "date": "2026-04-01",
      "duedate": "2026-04-15",
      "currencycode": "INR",
      "customername": "Acme Retail",
      "billingaddress": {
        "name": "Acme Retail",
        "line1": "Plot 10",
        "street": "MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "zip": "560001",
        "country": "India"
      },
      "shippingaddress": {
        "name": "Acme Retail",
        "line1": "Plot 10",
        "street": "MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "zip": "560001",
        "country": "India"
      },
      "itemtotal": 10000,
      "discount": 0,
      "subtotal": 10000,
      "tax": 1800,
      "roundoff": 0,
      "grandtotal": 11800,
      "items": [
        {
          "name": "Laptop",
          "displayname": "Laptop",
          "order": 1,
          "code": "LAP-001",
          "price": 10000,
          "quantity": 1,
          "itemtotal": 10000,
          "subtotal": 10000,
          "taxes": [
            {
              "name": "CGST 9%",
              "shortname": "CGST",
              "rate": 9,
              "appliedto": 10000,
              "amount": 900
            },
            {
              "name": "SGST 9%",
              "shortname": "SGST",
              "rate": 9,
              "appliedto": 10000,
              "amount": 900
            }
          ],
          "taxamount": 1800,
          "grandtotal": 11800
        }
      ],
      "deliverystate": "Karnataka",
      "taxoption": "exclusive"
    }
  ]
}
```

Rules:

- `customername` must match an active customer in the current branch.
- Every `items[].name` must match an active item in the current branch.
- Every `items[].taxes[].name`, when taxes are present, must match an active tax in the current branch.
- The backend persists `currencycode` from the customer record, even though the upload type includes `currencycode`.
- Invoice number uniqueness is `(number, branch)`.
- The backend validates sale invoice totals, discount math, tax math, item grand totals, and invoice grand total. Mirror those validations client-side for faster feedback.

### Customer Receipt

Endpoint: `POST /inventory/customer-receipt/bulk-upload`

```ts
type CustomerReceiptBulkUpload = {
  receipts: Array<{
    number?: string; // auto-generated when omitted
    date: string;
    amount: number;
    currencycode: string; // required by payload type, persisted from customer
    customername: string;
    bcashname: string;
    description?: string;
    invoices: Array<{
      saleinvoicenumber: string;
      amount: number;
    }>;
  }>;
};
```

Example:

```json
{
  "receipts": [
    {
      "date": "2026-04-20",
      "amount": 11800,
      "currencycode": "INR",
      "customername": "Acme Retail",
      "bcashname": "HDFC Current Account",
      "description": "Receipt against SI-001",
      "invoices": [
        {
          "saleinvoicenumber": "SI-001",
          "amount": 11800
        }
      ]
    }
  ]
}
```

Rules:

- `customername` must match an active customer in the current branch.
- `bcashname` must match a bank/cash record in the current branch.
- Every `saleinvoicenumber` must match a sale invoice in the current branch.
- If `number` is omitted, the backend auto-generates it using branch receipt numbering.
- The backend persists `currencycode` from the customer record.
- The sum of mapped invoice amounts cannot exceed the receipt `amount`.
- A receipt cannot overpay a sale invoice after considering existing receipts.
- Receipt number uniqueness is `(number, branch)` when a number is provided or generated.

### Vendor Payment

Endpoint: `POST /inventory/vendor-payment/bulk-upload`

```ts
type VendorPaymentBulkUpload = {
  payments: Array<{
    date: string;
    amount: number;
    currencycode: string; // required by payload type, persisted from vendor
    vendorname: string;
    bcashname: string;
    description?: string;
    invoices: Array<{
      purchaseinvoicenumber: string;
      amount: number;
    }>;
  }>;
};
```

Example:

```json
{
  "payments": [
    {
      "date": "2026-04-20",
      "amount": 11800,
      "currencycode": "INR",
      "vendorname": "Acme Supplies",
      "bcashname": "HDFC Current Account",
      "description": "Payment against PI-001",
      "invoices": [
        {
          "purchaseinvoicenumber": "PI-001",
          "amount": 11800
        }
      ]
    }
  ]
}
```

Rules:

- `vendorname` must match an active vendor in the current branch.
- `bcashname` must match a bank/cash record in the current branch.
- Every `purchaseinvoicenumber` must match a purchase invoice in the current branch.
- The backend persists `currencycode` from the vendor record.
- The sum of mapped invoice amounts cannot exceed the payment `amount`.
- A payment cannot overpay a purchase invoice after considering existing payments.

## Accounting Payloads

### Ledger Category

Endpoint: `POST /accounting/ledger-category/bulk-upload`

```ts
type LedgerCategoryBulkUpload = {
  ledgerCategory: Array<{
    name: string;
    description?: string;
    type?: LedgerCategoryType;
    parent?: string; // parent ledger-category name
  }>;
};

type LedgerCategoryType =
  | 'Asset'
  | 'Liability'
  | 'Income'
  | 'Expense'
  | 'Direct Expense'
  | 'Direct Income'
  | 'Indirect Expense'
  | 'Indirect Income'
  | 'Fixed Asset'
  | 'Current Asset'
  | 'Current Liability'
  | 'Long-Term Liability'
  | 'Sundry Debtors'
  | 'Sundry Creditors'
  | 'Bank Accounts'
  | 'Cash in Hand';
```

Example:

```json
{
  "ledgerCategory": [
    {
      "name": "Assets",
      "description": "Root asset category",
      "type": "Asset"
    },
    {
      "name": "Current Assets",
      "type": "Current Asset",
      "parent": "Assets"
    },
    {
      "name": "Bank Accounts",
      "type": "Bank Accounts",
      "parent": "Current Assets"
    }
  ]
}
```

Rules:

- Ledger-category names are unique per fiscal year.
- `type` is saved as `props.type`.
- `parent` is resolved by name in the active fiscal year. Parent can already exist or appear earlier in the same file hierarchy.
- Missing parent names can cause child rows to be skipped without a clear validation error. Validate parent names client-side before upload.

### Ledger

Endpoint: `POST /accounting/ledger/bulk-upload`

```ts
type LedgerBulkUpload = {
  ledgers: Array<{
    name: string;
    description?: string;
    openingdr?: number;
    openingcr?: number;
    category: string; // existing ledger-category name
  }>;
};
```

Example:

```json
{
  "ledgers": [
    {
      "name": "HDFC Bank Ledger",
      "description": "Ledger for HDFC current account",
      "openingdr": 0,
      "category": "Bank Accounts"
    },
    {
      "name": "Software Sales",
      "description": "Revenue from software",
      "category": "Direct Income"
    }
  ]
}
```

Rules:

- `category` must match a ledger-category name in the active fiscal year.
- Unknown categories are rejected. Create ledger categories first.
- Ledger names are unique per fiscal year.
- Prefer allowing either `openingdr` or `openingcr`, not both, in the UI. The current bulk service stores whichever values are sent.

### Bank Transaction

Endpoint: `POST /accounting/bank-txn/bulk-upload`

```ts
type BankTxnBulkUpload = {
  bankTxns: Array<{
    bankname: string; // BankCash.name
    txndate: string;
    description?: string;
    debit?: number;
    credit?: number;
    bankref?: string;
    props?: Record<string, unknown>;
  }>;
};
```

Example:

```json
{
  "bankTxns": [
    {
      "bankname": "HDFC Current Account",
      "txndate": "2026-04-05",
      "description": "Customer payment",
      "debit": 11800,
      "bankref": "NEFT-001",
      "props": {
        "source": "bank-statement"
      }
    },
    {
      "bankname": "HDFC Current Account",
      "txndate": "2026-04-06",
      "description": "Vendor payment",
      "credit": 11800,
      "bankref": "NEFT-002"
    }
  ]
}
```

Rules:

- `bankname` must match a bank/cash record that has a BankCashLedgerMap for the active fiscal year.
- If the mapping is missing, upload fails with a message listing bank names whose ledger mapping is missing.
- Exactly one of `debit` or `credit` should be provided and positive. The backend rejects neither and both.
- `txndate` must be inside the active fiscal year.
- `bankref` is indexed with the bank-cash ledger map but is not unique in the current model.

### Journal

Endpoint: `POST /accounting/journal/bulk-upload`

```ts
type JournalBulkUpload = {
  journals: Array<{
    date: string;
    number?: string; // auto-generated when omitted
    description?: string;
    props?: Record<string, unknown>;
    entries: Array<{
      ledger: string; // existing ledger name in active fiscal year
      debit?: number;
      credit?: number;
    }>;
  }>;
};
```

Example:

```json
{
  "journals": [
    {
      "date": "2026-04-10",
      "description": "Sales accrual",
      "entries": [
        {
          "ledger": "Cash in Hand",
          "debit": 11800
        },
        {
          "ledger": "Software Sales",
          "credit": 11800
        }
      ]
    }
  ]
}
```

Rules:

- `ledger` references are ledger names, not ledger ids.
- Every ledger name must exist in the active fiscal year.
- `date` must be inside the active fiscal year.
- If `number` is omitted, the backend auto-generates a journal number.
- Journal number uniqueness is `(number, fiscalyear)`.
- Each entry must have exactly one of `debit` or `credit`.
- Debit and credit values must be positive numbers.
- A ledger can appear only once per journal.
- Total debit must equal total credit after rounding to the active fiscal year's currency minor unit.

## Recommended UI Flow

Use a step-by-step import screen:

1. Choose model.
2. Download model JSON template.
3. Upload JSON file.
4. Client-side parse and validate root key, array shape, required fields, duplicate natural keys, date format, and known-name references when the UI has data loaded.
5. Show a preview table with row numbers and validation errors before calling the API.
6. Submit via `FormData`.
7. On success, show count and created records. On failure, show backend `error.message`.

Recommended import order when setting up a new organization:

1. `tax`
2. `tax-group`
3. `item-category`
4. `item`
5. `customer`
6. `vendor`
7. `bank-cash`
8. accounting `ledger-category`
9. accounting `ledger`
10. create BankCashLedgerMap records where needed
11. `purchase-invoice`
12. `sale-invoice`
13. `customer-receipt`
14. `vendor-payment`
15. accounting `bank-txn`
16. accounting `journal`

Client-side checks worth implementing:

- JSON root key exactly matches the selected model.
- Root array is non-empty.
- File size is below 1 MiB.
- Date strings match `YYYY-MM-DD`.
- Required names used as references exist or are created earlier in the same payload.
- Natural keys are not duplicated in the same file:
  - Item, item category, tax, tax group, bank/cash by `name`.
  - Ledger category and ledger by `name`.
  - Sale invoice by `number`.
  - Purchase invoice by `number` plus `vendorname`.
  - Journal by `number` when provided.
- Invoice totals and receipt/payment mappings balance before upload.
