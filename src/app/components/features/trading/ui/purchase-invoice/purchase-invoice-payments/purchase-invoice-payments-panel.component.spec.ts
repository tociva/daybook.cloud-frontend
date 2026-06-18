import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { BankCashStore } from '../../../data/bank-cash';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type { VendorPayment } from '../../../data/vendor-payment';
import {
  VendorPaymentFacade,
  VendorPaymentService,
  VendorPaymentStore,
} from '../../../data/vendor-payment';
import { PurchaseInvoicePaymentsPanelComponent } from './purchase-invoice-payments-panel.component';

const invoice: PurchaseInvoice = {
  id: 'pi-1',
  currencycode: 'INR',
  date: '2026-06-18',
  grandtotal: 1000,
  number: 'PI-001',
  payments: [],
  vendorid: 'vendor-1',
};

const payment: VendorPayment = {
  id: 'payment-1',
  amount: 250,
  bcashid: 'bank-1',
  currencycode: 'INR',
  date: '2026-06-18',
  vendorid: 'vendor-1',
};

type PaymentPanelHarness = Readonly<{
  amount: { set(value: string): void };
  bankCashId: { set(value: string): void };
  paymentDate: { set(value: string): void };
  savePayment(): Promise<void>;
}>;

function asHarness(component: PurchaseInvoicePaymentsPanelComponent): PaymentPanelHarness {
  return component as unknown as PaymentPanelHarness;
}

function setValidDraft(component: PurchaseInvoicePaymentsPanelComponent): void {
  const panel = asHarness(component);
  panel.amount.set('250');
  panel.bankCashId.set('bank-1');
  panel.paymentDate.set('2026-06-18');
}

async function setup() {
  const selectedItem = signal<PurchaseInvoice | null>(invoice);
  const purchaseInvoiceError = signal<string | null>(null);
  const purchaseInvoiceLoading = signal(false);
  const bankCashItems = signal([]);
  const vendorPaymentError = signal<string | null>(null);
  const create = vi.fn();
  const danger = vi.fn();

  await TestBed.configureTestingModule({
    imports: [PurchaseInvoicePaymentsPanelComponent],
    providers: [
      provideRouter([]),
      {
        provide: BankCashStore,
        useValue: {
          items: bankCashItems,
          loadBankCashes: vi.fn(async () => undefined),
        },
      },
      {
        provide: DateManagementService,
        useValue: {
          formatDisplayDate: vi.fn(
            (value: string | undefined, fallback = '-') => value ?? fallback,
          ),
        },
      },
      {
        provide: FiscalYearDateRangeService,
        useValue: {
          defaultDate: vi.fn((value?: string) => value ?? '2026-06-18'),
          errorMessage: vi.fn(() => null),
          toIsoDate: vi.fn((value: unknown) => (typeof value === 'string' ? value : null)),
        },
      },
      {
        provide: PurchaseInvoiceStore,
        useValue: {
          clearError: vi.fn(() => purchaseInvoiceError.set(null)),
          clearSelectedItem: vi.fn(() => selectedItem.set(null)),
          error: purchaseInvoiceError,
          isLoading: purchaseInvoiceLoading,
          loadPurchaseInvoiceById: vi.fn(async () => invoice),
          selectedItem,
        },
      },
      {
        provide: ToastStore,
        useValue: {
          danger,
        },
      },
      {
        provide: UserSessionStore,
        useValue: {
          session: signal(null),
        },
      },
      {
        provide: VendorPaymentFacade,
        useValue: {
          create,
        },
      },
      {
        provide: VendorPaymentService,
        useValue: {
          list: vi.fn(async () => []),
        },
      },
      {
        provide: VendorPaymentStore,
        useValue: {
          clearError: vi.fn(() => vendorPaymentError.set(null)),
          error: vendorPaymentError,
        },
      },
    ],
  })
    .overrideComponent(PurchaseInvoicePaymentsPanelComponent, {
      set: { template: '' },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(PurchaseInvoicePaymentsPanelComponent);
  fixture.componentRef.setInput('invoiceId', invoice.id);
  setValidDraft(fixture.componentInstance);

  return {
    component: fixture.componentInstance,
    create,
    danger,
    vendorPaymentError,
  };
}

describe('PurchaseInvoicePaymentsPanelComponent', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('shows backend create-payment errors as danger toasts', async () => {
    const { component, create, danger, vendorPaymentError } = await setup();
    create.mockImplementation(async () => {
      vendorPaymentError.set('Payment date is outside the active fiscal year.');
      return null;
    });

    await asHarness(component).savePayment();

    expect(danger).toHaveBeenCalledWith('Payment date is outside the active fiscal year.');
  });

  it('does not show a danger toast when payment creation succeeds', async () => {
    const { component, create, danger } = await setup();
    create.mockResolvedValue(payment);

    await asHarness(component).savePayment();

    expect(danger).not.toHaveBeenCalled();
  });
});
