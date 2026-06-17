import { describe, expect, it } from 'vitest';
import type { Vendor } from '../../../components/features/trading/data/vendor';
import {
  buildVendorTradingSearchEntries,
  createVendorTradingSearchIndex,
  searchVendorTradingEntries,
} from './vendor-trading-search';

function vendor(id: string | undefined, name: string): Vendor {
  return {
    id,
    name,
    countrycode: 'US',
    currencycode: 'USD',
    address: { name, line1: 'Line 1' },
  };
}

function readFilter(value: string): unknown {
  return JSON.parse(new URL(value, 'https://daybook.test').searchParams.get('filter') ?? '{}');
}

describe('vendor trading search', () => {
  it('builds purchase-invoice and vendor-payment list URLs with vendor filters', () => {
    const entries = buildVendorTradingSearchEntries([
      vendor('036f531b-95f2-49c2-ae8f-9e87f7f83e65', 'Acme Supplies'),
    ]);

    expect(entries.map((entry) => entry.label)).toEqual([
      'Acme Supplies - Purchase invoice list',
      'Acme Supplies - Vendor payment list',
    ]);
    expect(entries.map((entry) => entry.description)).toEqual([
      'View purchase invoices for Acme Supplies.',
      'View vendor payments for Acme Supplies.',
    ]);

    const [purchaseInvoiceEntry, vendorPaymentEntry] = entries;
    const purchaseInvoiceUrl = new URL(
      purchaseInvoiceEntry?.value ?? '',
      'https://daybook.test',
    );
    const vendorPaymentUrl = new URL(vendorPaymentEntry?.value ?? '', 'https://daybook.test');

    expect(purchaseInvoiceUrl.pathname).toBe('/app/trading/purchase-invoice');
    expect(vendorPaymentUrl.pathname).toBe('/app/trading/vendor-payment');
    expect(readFilter(purchaseInvoiceEntry?.value ?? '')).toEqual({
      limit: 10,
      offset: 0,
      where: { vendorid: '036f531b-95f2-49c2-ae8f-9e87f7f83e65' },
    });
    expect(readFilter(vendorPaymentEntry?.value ?? '')).toEqual({
      limit: 10,
      offset: 0,
      where: { vendorid: '036f531b-95f2-49c2-ae8f-9e87f7f83e65' },
    });
  });

  it('matches vendor names only and never returns entries for an empty query', () => {
    const index = createVendorTradingSearchIndex([
      vendor('acme', 'Acme Supplies'),
      vendor('bravo', 'Bravo Wholesale'),
    ]);

    expect(searchVendorTradingEntries(index, '')).toEqual([]);
    expect(searchVendorTradingEntries(index, 'Acme').map((entry) => entry.label)).toEqual([
      'Acme Supplies - Purchase invoice list',
      'Acme Supplies - Vendor payment list',
    ]);
    expect(searchVendorTradingEntries(index, 'purchase invoice')).toEqual([]);
    expect(searchVendorTradingEntries(index, 'vendor payment')).toEqual([]);
  });

  it('skips vendors without a usable id or name', () => {
    const entries = buildVendorTradingSearchEntries([
      vendor(undefined, 'Missing Id'),
      vendor('blank-name', '   '),
      vendor('acme', ' Acme Supplies '),
    ]);

    expect(entries.map((entry) => entry.label)).toEqual([
      'Acme Supplies - Purchase invoice list',
      'Acme Supplies - Vendor payment list',
    ]);
  });
});
