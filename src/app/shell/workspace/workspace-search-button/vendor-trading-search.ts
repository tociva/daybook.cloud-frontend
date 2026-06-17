import Fuse from 'fuse.js';
import type { Vendor } from '../../../components/features/trading/data/vendor';
import { serializeLb4FilterForUrl } from '../../../shared/crud';

export type VendorTradingSearchEntry = Readonly<{
  description: string;
  label: string;
  value: string;
  vendorName: string;
}>;

export type VendorTradingSearchIndex = Readonly<{
  entries: readonly VendorTradingSearchEntry[];
  fuse: Fuse<VendorTradingSearchEntry>;
}>;

export const VENDOR_TRADING_SEARCH_LIMIT = 10;

type VendorTradingSearchTarget = Readonly<{
  description: (vendorName: string) => string;
  labelSuffix: string;
  path: string;
}>;

const VENDOR_TRADING_SEARCH_TARGETS: readonly VendorTradingSearchTarget[] = [
  {
    description: (vendorName) => `View purchase invoices for ${vendorName}.`,
    labelSuffix: 'Purchase invoice list',
    path: '/app/trading/purchase-invoice',
  },
  {
    description: (vendorName) => `View vendor payments for ${vendorName}.`,
    labelSuffix: 'Vendor payment list',
    path: '/app/trading/vendor-payment',
  },
];

export function buildVendorTradingSearchUrl(path: string, vendorId: string): string {
  const filter = serializeLb4FilterForUrl(
    { limit: 10, offset: 0, where: { vendorid: vendorId } },
    10,
  );

  return `${path}?filter=${encodeURIComponent(filter ?? '')}`;
}

export function buildVendorTradingSearchEntries(
  vendors: readonly Vendor[],
): readonly VendorTradingSearchEntry[] {
  return vendors.flatMap((vendor) => {
    const vendorId = vendor.id?.trim();
    const vendorName = vendor.name?.trim();

    if (!vendorId || !vendorName) return [];

    return VENDOR_TRADING_SEARCH_TARGETS.map((target) => ({
      description: target.description(vendorName),
      label: `${vendorName} - ${target.labelSuffix}`,
      value: buildVendorTradingSearchUrl(target.path, vendorId),
      vendorName,
    }));
  });
}

export function createVendorTradingSearchIndex(
  vendors: readonly Vendor[],
): VendorTradingSearchIndex {
  const entries = buildVendorTradingSearchEntries(vendors);

  return {
    entries,
    fuse: new Fuse(entries, {
      keys: [{ name: 'vendorName', weight: 1 }],
      threshold: 0.35,
      includeScore: false,
      ignoreLocation: true,
    }),
  };
}

export function searchVendorTradingEntries(
  index: VendorTradingSearchIndex,
  query: string,
  limit = VENDOR_TRADING_SEARCH_LIMIT,
): readonly VendorTradingSearchEntry[] {
  const q = query.trim();
  if (!q) return [];

  return index.fuse.search(q, { limit }).map((result) => result.item);
}
