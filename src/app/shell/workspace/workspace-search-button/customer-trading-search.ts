import Fuse from 'fuse.js';
import type { Customer } from '../../../components/features/trading/data/customer';
import { serializeLb4FilterForUrl } from '../../../shared/crud';

export type CustomerTradingSearchEntry = Readonly<{
  customerName: string;
  description: string;
  label: string;
  value: string;
}>;

export type CustomerTradingSearchIndex = Readonly<{
  entries: readonly CustomerTradingSearchEntry[];
  fuse: Fuse<CustomerTradingSearchEntry>;
}>;

export const CUSTOMER_TRADING_SEARCH_LIMIT = 10;

type CustomerTradingSearchTarget = Readonly<{
  description: (customerName: string) => string;
  labelSuffix: string;
  path: string;
}>;

const CUSTOMER_TRADING_SEARCH_TARGETS: readonly CustomerTradingSearchTarget[] = [
  {
    description: (customerName) => `View sale invoices for ${customerName}.`,
    labelSuffix: 'Sale invoice list',
    path: '/app/trading/sale-invoice',
  },
  {
    description: (customerName) => `View customer receipts for ${customerName}.`,
    labelSuffix: 'Customer receipt list',
    path: '/app/trading/customer-receipt',
  },
];

export function buildCustomerTradingSearchUrl(path: string, customerId: string): string {
  const filter = serializeLb4FilterForUrl(
    { limit: 10, offset: 0, where: { customerid: customerId } },
    10,
  );

  return `${path}?filter=${encodeURIComponent(filter ?? '')}`;
}

export function buildCustomerTradingSearchEntries(
  customers: readonly Customer[],
): readonly CustomerTradingSearchEntry[] {
  return customers.flatMap((customer) => {
    const customerId = customer.id?.trim();
    const customerName = customer.name?.trim();

    if (!customerId || !customerName) return [];

    return CUSTOMER_TRADING_SEARCH_TARGETS.map((target) => ({
      customerName,
      description: target.description(customerName),
      label: `${customerName} - ${target.labelSuffix}`,
      value: buildCustomerTradingSearchUrl(target.path, customerId),
    }));
  });
}

export function createCustomerTradingSearchIndex(
  customers: readonly Customer[],
): CustomerTradingSearchIndex {
  const entries = buildCustomerTradingSearchEntries(customers);

  return {
    entries,
    fuse: new Fuse(entries, {
      keys: [{ name: 'customerName', weight: 1 }],
      threshold: 0.35,
      includeScore: false,
      ignoreLocation: true,
    }),
  };
}

export function searchCustomerTradingEntries(
  index: CustomerTradingSearchIndex,
  query: string,
  limit = CUSTOMER_TRADING_SEARCH_LIMIT,
): readonly CustomerTradingSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  return index.fuse.search(q, { limit }).map((result) => result.item);
}
