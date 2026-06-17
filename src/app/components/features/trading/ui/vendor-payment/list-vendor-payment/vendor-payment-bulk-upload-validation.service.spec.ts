import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BankCashService } from '../../../data/bank-cash/bank-cash.service';
import type { PurchaseInvoiceService } from '../../../data/purchase-invoice/purchase-invoice.service';
import type { VendorService } from '../../../data/vendor/vendor.service';
import { VendorPaymentBulkUploadValidationService } from './vendor-payment-bulk-upload-validation.service';

describe('VendorPaymentBulkUploadValidationService', () => {
  let service: VendorPaymentBulkUploadValidationService;

  const vendorService = {
    list: vi.fn().mockResolvedValue([]),
  };

  const bankCashService = {
    list: vi.fn().mockResolvedValue([]),
  };

  const purchaseInvoiceService = {
    list: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vendorService.list.mockResolvedValue([
      { id: 'vendor-1', name: 'Acme Supplies', currencycode: 'INR', status: 1 },
      { id: 'vendor-2', name: 'Dormant Supplies', currencycode: 'INR', status: 0 },
      { id: 'vendor-3', name: 'Legacy Supplies', currencycode: 'INR' },
    ]);
    bankCashService.list.mockResolvedValue([{ id: 'bank-1', name: 'HDFC Current Account' }]);
    purchaseInvoiceService.list.mockResolvedValue([
      {
        id: 'invoice-1',
        number: 'PI-001',
        grandtotal: 10000,
        payments: [{ amount: 7000 }],
      },
      {
        id: 'invoice-2',
        number: 'PI-002',
        grandtotal: 8000,
        payments: [],
      },
    ]);

    service = new VendorPaymentBulkUploadValidationService(
      bankCashService as unknown as BankCashService,
      purchaseInvoiceService as unknown as PurchaseInvoiceService,
      vendorService as unknown as VendorService,
    );
  });

  it('reports branch reference, currency, duplicate, and allocation total errors', async () => {
    const errors = await service.validateReferences({
      payments: [
        {
          date: '2026-04-20',
          amount: 100,
          vendorname: 'Missing Vendor',
          bcashname: 'Missing Cash',
          invoices: [{ purchaseinvoicenumber: 'PI-MISSING', amount: 50 }],
        },
        {
          date: '2026-04-20',
          amount: 100,
          vendorname: 'Dormant Supplies',
          bcashname: 'HDFC Current Account',
          invoices: [],
        },
        {
          date: '2026-04-20',
          amount: 5000,
          vendorname: 'Acme Supplies',
          bcashname: 'HDFC Current Account',
          currencycode: 'USD',
          invoices: [{ purchaseinvoicenumber: 'PI-001', amount: 4000 }],
        },
        {
          date: '2026-04-20',
          amount: 100,
          vendorname: 'Acme Supplies',
          bcashname: 'HDFC Current Account',
          invoices: [
            { purchaseinvoicenumber: 'PI-002', amount: 60 },
            { purchaseinvoicenumber: 'PI-002', amount: 50 },
          ],
        },
      ],
    });

    expect(errors).toContain('Payment 1 (Missing Vendor): vendor not found in current branch.');
    expect(errors).toContain(
      'Payment 1 (Missing Vendor): bank/cash account not found in current branch.',
    );
    expect(errors).toContain(
      'Payment 1 (Missing Vendor), allocation 1: purchase invoice not found in current branch.',
    );
    expect(errors).toContain('Payment 2 (Dormant Supplies): vendor is inactive.');
    expect(errors).toContain(
      'Payment 3 (Acme Supplies): currencycode must match the selected vendor currency (INR).',
    );
    expect(errors).toContain(
      'Payment 3 (Acme Supplies), allocation 1: total payment amount assigned to purchase invoice PI-001 is more than the purchase invoice amount.',
    );
    expect(errors).toContain(
      'Payment 4 (Acme Supplies), allocation 2: duplicate purchase invoice number "PI-002" (also used by allocation 1).',
    );
    expect(errors).toContain(
      'Payment 4 (Acme Supplies): payment amount is less than the total allocation amount.',
    );
  });

  it('accepts valid allocated, unallocated, and legacy-vendor payments', async () => {
    const errors = await service.validateReferences({
      payments: [
        {
          date: '2026-04-20',
          amount: 3000,
          vendorname: 'Acme Supplies',
          bcashname: 'HDFC Current Account',
          currencycode: 'INR',
          invoices: [{ purchaseinvoicenumber: 'PI-001', amount: 3000 }],
        },
        {
          date: '2026-04-21',
          amount: 5000,
          vendorname: 'Legacy Supplies',
          bcashname: 'HDFC Current Account',
          invoices: [],
        },
      ],
    });

    expect(errors).toEqual([]);
  });

  it('keeps the first duplicate vendor and does not limit vendor name lookups', async () => {
    const vendors = [
      { id: 'vendor-1', name: 'Acme Supplies', currencycode: 'INR', status: 1 },
      { id: 'vendor-2', name: 'Acme Supplies', currencycode: 'USD', status: 1 },
      { id: 'vendor-3', name: 'Beta Traders', currencycode: 'USD', status: 1 },
    ];

    vendorService.list.mockImplementation((query?: { limit?: number }) =>
      Promise.resolve(vendors.slice(0, query?.limit ?? vendors.length)),
    );

    const errors = await service.validateReferences({
      payments: [
        {
          date: '2026-04-20',
          amount: 100,
          vendorname: 'Acme Supplies',
          bcashname: 'HDFC Current Account',
          currencycode: 'INR',
          invoices: [],
        },
        {
          date: '2026-04-21',
          amount: 100,
          vendorname: 'Beta Traders',
          bcashname: 'HDFC Current Account',
          currencycode: 'USD',
          invoices: [],
        },
      ],
    });

    expect(vendorService.list).toHaveBeenCalledWith({
      where: { name: { inq: ['Acme Supplies', 'Beta Traders'] } },
    });
    expect(errors).toEqual([]);
  });

  it('skips reference validation until the payload root is structurally valid', async () => {
    await expect(service.validateReferences({ payments: {} })).resolves.toEqual([]);
    expect(vendorService.list).not.toHaveBeenCalled();
    expect(bankCashService.list).not.toHaveBeenCalled();
    expect(purchaseInvoiceService.list).not.toHaveBeenCalled();
  });
});
