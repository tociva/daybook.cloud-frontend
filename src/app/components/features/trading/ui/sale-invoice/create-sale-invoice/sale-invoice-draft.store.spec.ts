import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { Customer } from '../../../data/customer';
import { CustomerStore } from '../../../data/customer';
import { ItemStore } from '../../../data/item';
import { ItemCategoryStore } from '../../../data/item-category';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { SaleInvoiceDraftStore } from './sale-invoice-draft.store';

const selectedCustomer: Customer = {
  id: 'customer-selected',
  name: 'Selected Customer',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29SELECTED1234Z5',
  address: { name: 'Selected Customer', line1: 'Selected line' },
};

const gstCustomer: Customer = {
  id: 'customer-gst',
  name: 'GST Customer',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29ABCDE1234F1Z5',
  address: { name: 'GST Customer', line1: 'GST line' },
};

describe('SaleInvoiceDraftStore GST reconciliation party prefill', () => {
  function configure(
    customers: readonly Customer[] = [],
    storeSelectedCustomer: Customer | null = null,
  ) {
    TestBed.configureTestingModule({
      providers: [
        SaleInvoiceDraftStore,
        {
          provide: CustomerStore,
          useValue: {
            items: vi.fn(() => customers),
            selectedItem: vi.fn(() => storeSelectedCustomer),
          },
        },
        { provide: ItemStore, useValue: { items: vi.fn(() => []) } },
        { provide: ItemCategoryStore, useValue: {} },
        { provide: TaxGroupStore, useValue: { catalog: vi.fn(() => []) } },
        { provide: TaxStore, useValue: { catalog: vi.fn(() => []), loadTaxById: vi.fn() } },
        { provide: UserSessionStore, useValue: { session: signal(null) } },
        {
          provide: FiscalYearDateRangeService,
          useValue: {
            defaultDate: vi.fn((value?: string) => value || '2026-04-01'),
            errorMessage: vi.fn(() => null),
            range: signal(null),
          },
        },
      ],
    });

    return TestBed.inject(SaleInvoiceDraftStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('keeps the explicitly selected customer when partyId is present', () => {
    const draft = configure([], selectedCustomer);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyId: 'customer-selected',
        partyName: 'GST Portal Name',
        partyGstin: '29PORTAL1234F1Z5',
      }),
    );

    expect(draft.customerid()).toBe('customer-selected');
    expect(draft.selectedCustomer()).toBe(selectedCustomer);
    expect(draft.customerSearch()).toBe('Selected Customer');
  });

  it('falls back to GSTIN matching when partyId is missing', () => {
    const draft = configure([gstCustomer]);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyName: 'GST Portal Name',
        partyGstin: '29ABCDE1234F1Z5',
      }),
    );

    expect(draft.customerid()).toBe('customer-gst');
    expect(draft.selectedCustomer()).toBe(gstCustomer);
  });
});
