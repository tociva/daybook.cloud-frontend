import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { ItemStore } from '../../../data/item/item.store';
import { PurchaseInvoiceService } from '../../../data/purchase-invoice/purchase-invoice.service';
import { TaxStore } from '../../../data/tax/tax.store';
import { VendorStore } from '../../../data/vendor/vendor.store';
import { PurchaseInvoiceBulkUploadValidationService } from './purchase-invoice-bulk-upload-validation.service';

describe('PurchaseInvoiceBulkUploadValidationService', () => {
  let service: PurchaseInvoiceBulkUploadValidationService;

  const vendorStore = {
    loadVendors: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn(),
    items: vi.fn().mockReturnValue([]),
  };

  const itemStore = {
    loadItems: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn(),
    items: vi.fn().mockReturnValue([]),
  };

  const taxStore = {
    loadTaxes: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn(),
    items: vi.fn().mockReturnValue([]),
  };

  const currencyStore = {
    load: vi.fn().mockResolvedValue(undefined),
    currencies: vi.fn().mockReturnValue([{ code: 'INR', minorunit: 2 }]),
  };

  const purchaseInvoiceService = {
    list: vi.fn().mockResolvedValue([]),
  };

  const userSessionStore = {
    session: vi.fn().mockReturnValue({
      branch: { currencycode: 'INR' },
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vendorStore.catalog.mockReturnValue([
      { id: 'vendor-1', name: 'Acme Supplies', currencycode: 'INR', status: 1 },
      { id: 'vendor-2', name: 'Dormant Supplies', currencycode: 'INR', status: 0 },
      { id: 'vendor-3', name: 'Other Supplies', currencycode: 'INR', status: 1 },
      { id: 'vendor-4', name: 'Legacy Supplies', currencycode: 'INR' },
    ]);
    itemStore.catalog.mockReturnValue([{ name: 'Laptop' }]);
    taxStore.catalog.mockReturnValue([{ name: 'CGST 9%' }]);
    purchaseInvoiceService.list.mockResolvedValue([]);

    TestBed.configureTestingModule({
      providers: [
        PurchaseInvoiceBulkUploadValidationService,
        { provide: VendorStore, useValue: vendorStore },
        { provide: ItemStore, useValue: itemStore },
        { provide: TaxStore, useValue: taxStore },
        { provide: CurrencyStore, useValue: currencyStore },
        { provide: PurchaseInvoiceService, useValue: purchaseInvoiceService },
        { provide: UserSessionStore, useValue: userSessionStore },
      ],
    });

    service = TestBed.inject(PurchaseInvoiceBulkUploadValidationService);
  });

  it('reports missing vendor, inactive vendor, missing item, missing tax, currency mismatch, and existing invoice number', async () => {
    purchaseInvoiceService.list.mockResolvedValue([{ number: 'PI-EXISTS', vendorid: 'vendor-1' }]);

    const errors = await service.validateReferences({
      invoices: [
        {
          number: 'PI-001',
          vendorname: 'Missing Vendor',
          items: [
            {
              name: 'Missing Item',
              taxes: [{ name: 'Missing Tax' }],
            },
          ],
        },
        {
          number: 'PI-002',
          vendorname: 'Dormant Supplies',
          items: [{ name: 'Laptop' }],
        },
        {
          number: 'PI-003',
          vendorname: 'Acme Supplies',
          currencycode: 'USD',
          items: [{ name: 'Laptop' }],
        },
        {
          number: 'PI-EXISTS',
          vendorname: 'Acme Supplies',
          items: [{ name: 'Laptop' }],
        },
      ],
    });

    expect(errors).toContain('Invoice 1 (PI-001): vendor not found.');
    expect(errors).toContain('Invoice 2 (PI-002): vendor is inactive.');
    expect(errors).toContain(
      'Invoice 3 (PI-003): currencycode must match the selected vendor currency (INR).',
    );
    expect(errors).toContain(
      'Invoice 1 (PI-001), Missing Item: item name not found in this branch.',
    );
    expect(errors).toContain(
      'Invoice 1 (PI-001), Missing Item, tax 1: tax name not found in this branch.',
    );
    expect(errors).toContain(
      'Invoice 4 (PI-EXISTS): invoice number already exists for this vendor in this branch.',
    );
  });

  it('allows an existing invoice number for a different vendor', async () => {
    purchaseInvoiceService.list.mockResolvedValue([{ number: 'PI-001', vendorid: 'vendor-3' }]);

    const errors = await service.validateReferences({
      invoices: [
        {
          number: 'PI-001',
          vendorname: 'Acme Supplies',
          items: [{ name: 'Laptop' }],
        },
      ],
    });

    expect(errors).not.toContain(
      'Invoice 1 (PI-001): invoice number already exists for this vendor in this branch.',
    );
  });

  it('treats vendors with missing status as active for legacy records', async () => {
    const errors = await service.validateReferences({
      invoices: [
        {
          number: 'PI-001',
          vendorname: 'Legacy Supplies',
          items: [{ name: 'Laptop' }],
        },
      ],
    });

    expect(errors).toEqual([]);
  });

  it('resolves branch minor unit from loaded currencies', () => {
    expect(service.branchMinorUnit()).toBe(2);
  });
});
