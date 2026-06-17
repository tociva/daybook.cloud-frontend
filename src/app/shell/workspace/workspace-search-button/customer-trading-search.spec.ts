import { describe, expect, it } from 'vitest';
import type { Customer } from '../../../components/features/trading/data/customer';
import {
  buildCustomerTradingSearchEntries,
  createCustomerTradingSearchIndex,
  searchCustomerTradingEntries,
} from './customer-trading-search';

function customer(id: string | undefined, name: string): Customer {
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

describe('customer trading search', () => {
  it('builds sale-invoice and customer-receipt list URLs with customer filters', () => {
    const entries = buildCustomerTradingSearchEntries([
      customer('0e547b6c-eebc-4274-b45b-17803aad9353', 'Spectrio LLC'),
    ]);

    expect(entries.map((entry) => entry.label)).toEqual([
      'Spectrio LLC - Sale invoice list',
      'Spectrio LLC - Customer receipt list',
    ]);
    expect(entries.map((entry) => entry.description)).toEqual([
      'View sale invoices for Spectrio LLC.',
      'View customer receipts for Spectrio LLC.',
    ]);

    const [saleInvoiceEntry, customerReceiptEntry] = entries;
    const saleInvoiceUrl = new URL(saleInvoiceEntry?.value ?? '', 'https://daybook.test');
    const customerReceiptUrl = new URL(customerReceiptEntry?.value ?? '', 'https://daybook.test');

    expect(saleInvoiceUrl.pathname).toBe('/app/trading/sale-invoice');
    expect(customerReceiptUrl.pathname).toBe('/app/trading/customer-receipt');
    expect(readFilter(saleInvoiceEntry?.value ?? '')).toEqual({
      limit: 10,
      offset: 0,
      where: { customerid: '0e547b6c-eebc-4274-b45b-17803aad9353' },
    });
    expect(readFilter(customerReceiptEntry?.value ?? '')).toEqual({
      limit: 10,
      offset: 0,
      where: { customerid: '0e547b6c-eebc-4274-b45b-17803aad9353' },
    });
  });

  it('matches customer names only and never returns entries for an empty query', () => {
    const index = createCustomerTradingSearchIndex([
      customer('spectrio', 'Spectrio LLC'),
      customer('acme', 'Acme Retail'),
    ]);

    expect(searchCustomerTradingEntries(index, '')).toEqual([]);
    expect(searchCustomerTradingEntries(index, 'Spectrio').map((entry) => entry.label)).toEqual([
      'Spectrio LLC - Sale invoice list',
      'Spectrio LLC - Customer receipt list',
    ]);
    expect(searchCustomerTradingEntries(index, 'customer receipt')).toEqual([]);
    expect(searchCustomerTradingEntries(index, 'sale invoice')).toEqual([]);
  });

  it('skips customers without a usable id or name', () => {
    const entries = buildCustomerTradingSearchEntries([
      customer(undefined, 'Missing Id'),
      customer('blank-name', '   '),
      customer('spectrio', ' Spectrio LLC '),
    ]);

    expect(entries.map((entry) => entry.label)).toEqual([
      'Spectrio LLC - Sale invoice list',
      'Spectrio LLC - Customer receipt list',
    ]);
  });
});
