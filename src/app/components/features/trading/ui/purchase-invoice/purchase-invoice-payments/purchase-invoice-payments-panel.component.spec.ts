import { Component, ElementRef, inject, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
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

const paidInvoice: PurchaseInvoice = {
  ...invoice,
  payments: [{ amount: 1000, vendorpaymentid: 'payment-1' }],
};

const focusTemplate = `
  @if (canAddPayment()) {
    <app-fiscal-year-datepicker
      #paymentDatepicker
      inputAriaLabel="Payment date"
      [value]="paymentDate()"
      [invalid]="submitted() && getPaymentDateError() !== null"
      (valueChange)="onPaymentDateChange($event)"
    />
  }
`;

@Component({
  selector: 'app-fiscal-year-datepicker',
  standalone: true,
  template: '<input data-slot="datepicker-input" />',
})
class TestFiscalYearDatepickerComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly inputAriaLabel = input('Choose date');
  readonly invalid = input(false);
  readonly value = input<unknown>(null);

  readonly valueChange = output<unknown>();

  focusInput(): void {
    this.hostElement.nativeElement
      .querySelector<HTMLInputElement>('input[data-slot="datepicker-input"]')
      ?.focus();
  }
}

type PaymentPanelHarness = Readonly<{
  amount: { set(value: string): void };
  bankCashId: { set(value: string): void };
  paymentDate: { set(value: string): void };
  savePayment(): Promise<void>;
}>;

type SetupOptions = Readonly<{
  selectedInvoice?: PurchaseInvoice;
  stubDatepicker?: boolean;
  template?: string;
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

async function flushDeferredFocus(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve);
  });
  await Promise.resolve();
}

async function setup(options: SetupOptions = {}) {
  const selectedInvoice = options.selectedInvoice ?? invoice;
  const selectedItem = signal<PurchaseInvoice | null>(selectedInvoice);
  const purchaseInvoiceError = signal<string | null>(null);
  const purchaseInvoiceLoading = signal(false);
  const bankCashItems = signal([]);
  const vendorPaymentError = signal<string | null>(null);
  const create = vi.fn();
  const danger = vi.fn();

  const testingModule = TestBed.configureTestingModule({
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
          displayDateFormat: signal('DD/MM/YYYY'),
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
          isWithinFiscalYear: vi.fn(() => true),
          maxDate: signal(null),
          minDate: signal(null),
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
          loadPurchaseInvoiceById: vi.fn(async () => selectedInvoice),
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
  });

  if (options.stubDatepicker) {
    testingModule.overrideComponent(PurchaseInvoicePaymentsPanelComponent, {
      remove: { imports: [FiscalYearDatepickerComponent] },
      add: { imports: [TestFiscalYearDatepickerComponent] },
    });
  }
  testingModule.overrideTemplate(PurchaseInvoicePaymentsPanelComponent, options.template ?? '');

  await testingModule.compileComponents();

  const fixture = TestBed.createComponent(PurchaseInvoicePaymentsPanelComponent);
  fixture.componentRef.setInput('invoiceId', selectedInvoice.id);
  setValidDraft(fixture.componentInstance);

  return {
    component: fixture.componentInstance,
    create,
    danger,
    fixture,
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

  it('focuses the payment date input after the add-payment row resets', async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const { fixture } = await setup({ stubDatepicker: true, template: focusTemplate });

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await flushDeferredFocus();

    const host = fixture.nativeElement as HTMLElement;
    const dateInput = host.querySelector<HTMLInputElement>(
      'input[data-slot="datepicker-input"]',
    );

    expect(dateInput).not.toBeNull();
    expect(fixture.nativeElement.ownerDocument.activeElement).toBe(dateInput);
  });

  it('keeps focus on an outside form control when the add-payment row resets', async () => {
    const outsideInput = document.createElement('input');
    document.body.appendChild(outsideInput);
    outsideInput.focus();

    try {
      const { fixture } = await setup({ stubDatepicker: true, template: focusTemplate });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await flushDeferredFocus();

      const host = fixture.nativeElement as HTMLElement;
      const dateInput = host.querySelector<HTMLInputElement>(
        'input[data-slot="datepicker-input"]',
      );

      expect(dateInput).not.toBeNull();
      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(outsideInput);
    } finally {
      outsideInput.remove();
    }
  });

  it('does not focus payment date when the invoice is already paid', async () => {
    const outsideInput = document.createElement('input');
    document.body.appendChild(outsideInput);
    outsideInput.focus();

    try {
      const { fixture } = await setup({
        selectedInvoice: paidInvoice,
        stubDatepicker: true,
        template: focusTemplate,
      });

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await flushDeferredFocus();

      const host = fixture.nativeElement as HTMLElement;
      const dateInput = host.querySelector<HTMLInputElement>(
        'input[data-slot="datepicker-input"]',
      );

      expect(dateInput).toBeNull();
      expect(fixture.nativeElement.ownerDocument.activeElement).toBe(outsideInput);
    } finally {
      outsideInput.remove();
    }
  });
});
