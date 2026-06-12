import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import type { Vendor } from '../../../data/vendor';
import { VendorStore } from '../../../data/vendor';
import { ItemStore } from '../../../data/item';
import { ItemCategoryStore } from '../../../data/item-category';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { PurchaseInvoiceDraftStore } from './purchase-invoice-draft.store';

const selectedVendor: Vendor = {
  id: 'vendor-selected',
  name: 'Selected Vendor',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29SELECTED1234Z5',
  address: { name: 'Selected Vendor', line1: 'Selected line' },
};

const gstVendor: Vendor = {
  id: 'vendor-gst',
  name: 'GST Vendor',
  countrycode: 'IN',
  currencycode: 'INR',
  gstin: '29ABCDE1234F1Z5',
  address: { name: 'GST Vendor', line1: 'GST line' },
};

describe('PurchaseInvoiceDraftStore GST reconciliation party prefill', () => {
  function configure(vendors: readonly Vendor[] = [], storeSelectedVendor: Vendor | null = null) {
    TestBed.configureTestingModule({
      providers: [
        PurchaseInvoiceDraftStore,
        {
          provide: VendorStore,
          useValue: {
            items: vi.fn(() => vendors),
            selectedItem: vi.fn(() => storeSelectedVendor),
          },
        },
        { provide: ItemStore, useValue: { items: vi.fn(() => []) } },
        { provide: ItemCategoryStore, useValue: {} },
        { provide: TaxGroupStore, useValue: { catalog: vi.fn(() => []) } },
        { provide: TaxStore, useValue: { catalog: vi.fn(() => []), loadTaxById: vi.fn() } },
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

    return TestBed.inject(PurchaseInvoiceDraftStore);
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('keeps the explicitly selected vendor when partyId is present', () => {
    const draft = configure([], selectedVendor);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyId: 'vendor-selected',
        partyName: 'GST Portal Name',
        partyGstin: '29PORTAL1234F1Z5',
      }),
    );

    expect(draft.vendorid()).toBe('vendor-selected');
    expect(draft.selectedVendor()).toBe(selectedVendor);
    expect(draft.vendorSearch()).toBe('Selected Vendor');
  });

  it('falls back to GSTIN matching when partyId is missing', () => {
    const draft = configure([gstVendor]);

    draft.patchFromGstReconciliation(
      convertToParamMap({
        partyName: 'GST Portal Name',
        partyGstin: '29ABCDE1234F1Z5',
      }),
    );

    expect(draft.vendorid()).toBe('vendor-gst');
    expect(draft.selectedVendor()).toBe(gstVendor);
  });
});
