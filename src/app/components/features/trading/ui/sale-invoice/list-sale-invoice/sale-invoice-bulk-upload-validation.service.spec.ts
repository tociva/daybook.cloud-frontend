import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { CustomerStore } from '../../../data/customer/customer.store';
import { ItemStore } from '../../../data/item/item.store';
import { SaleInvoiceService } from '../../../data/sale-invoice/sale-invoice.service';
import { TaxStore } from '../../../data/tax/tax.store';
import { SaleInvoiceBulkUploadValidationService } from './sale-invoice-bulk-upload-validation.service';

describe('SaleInvoiceBulkUploadValidationService', () => {
  let service: SaleInvoiceBulkUploadValidationService;

  const customerStore = {
    loadCustomers: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn().mockReturnValue([
      { name: 'Acme Retail', currencycode: 'INR' },
    ]),
  };

  const itemStore = {
    loadItems: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn().mockReturnValue([{ name: 'Laptop' }]),
  };

  const taxStore = {
    loadTaxes: vi.fn().mockResolvedValue(undefined),
    catalog: vi.fn().mockReturnValue([{ name: 'CGST 9%' }]),
  };

  const currencyStore = {
    load: vi.fn().mockResolvedValue(undefined),
    currencies: vi.fn().mockReturnValue([{ code: 'INR', minorunit: 2 }]),
  };

  const saleInvoiceService = {
    list: vi.fn().mockResolvedValue([]),
  };

  const userSessionStore = {
    session: vi.fn().mockReturnValue({
      branch: { currencycode: 'INR' },
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        SaleInvoiceBulkUploadValidationService,
        { provide: CustomerStore, useValue: customerStore },
        { provide: ItemStore, useValue: itemStore },
        { provide: TaxStore, useValue: taxStore },
        { provide: CurrencyStore, useValue: currencyStore },
        { provide: SaleInvoiceService, useValue: saleInvoiceService },
        { provide: UserSessionStore, useValue: userSessionStore },
      ],
    });

    service = TestBed.inject(SaleInvoiceBulkUploadValidationService);
  });

  it('reports missing customer, item, tax, currency mismatch, and existing invoice number', async () => {
    saleInvoiceService.list.mockResolvedValue([{ number: 'SI-002' }]);

    const errors = await service.validateReferences({
      invoices: [
        {
          number: 'SI-001',
          customername: 'Missing Customer',
          items: [
            {
              name: 'Missing Item',
              taxes: [{ name: 'Missing Tax' }],
            },
          ],
        },
        {
          number: 'SI-003',
          customername: 'Acme Retail',
          currencycode: 'USD',
          items: [{ name: 'Laptop' }],
        },
        {
          number: 'SI-002',
          customername: 'Acme Retail',
          items: [{ name: 'Laptop' }],
        },
      ],
    });

    expect(errors).toContain('Invoice 1 (SI-001): customer not found.');
    expect(errors).toContain(
      'Invoice 2 (SI-003): currencycode must match the selected customer currency (INR).',
    );
    expect(errors).toContain(
      'Invoice 1 (SI-001), Missing Item: item name not found in this branch.',
    );
    expect(errors).toContain(
      'Invoice 1 (SI-001), Missing Item, tax 1: tax name not found in this branch.',
    );
    expect(errors).toContain('Invoice 3 (SI-002): invoice number already exists in this branch.');
  });

  it('resolves branch minor unit from loaded currencies', () => {
    expect(service.branchMinorUnit()).toBe(2);
  });
});
