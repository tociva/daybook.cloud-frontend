import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import dayjs from 'dayjs';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../data/bank-cash';
import type { Currency } from '../../../../../features/management/data/currency/currency.model';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';
import { UserSessionStore } from '../../../../../features/management/data/user-session/user-session.store';
import type { Customer } from '../../../data/customer/customer.model';
import { CustomerStore } from '../../../data/customer';
import type {
  CustomerReceipt,
  CustomerReceiptInvoiceRequest,
  CustomerReceiptPayload,
} from '../../../data/customer-receipt';
import { CustomerReceiptFacade, CustomerReceiptStore } from '../../../data/customer-receipt';
import type { SaleInvoice } from '../../../data/sale-invoice/sale-invoice.model';
import { SaleInvoiceStore } from '../../../data/sale-invoice';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import {
  InvoiceRow,
  RcptInvoiceLinesComponent,
} from './rcpt-invoice-lines/rcpt-invoice-lines.component';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-customer-receipt',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngLabelComponent,
    TngStepperComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    RcptInvoiceLinesComponent,
  ],
  templateUrl: './create-customer-receipt.component.html',
  styleUrl: './create-customer-receipt.component.css',
})
export class CreateCustomerReceiptComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CustomerReceiptFacade);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly bankCashStore = inject(BankCashStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private customerSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Customer Receipt' : 'New Customer Receipt',
  );

  /**
   * Set to true when the form is pre-filled from a sale-invoice query param so
   * that RcptInvoiceLinesComponent's auto-load effect does not overwrite the row.
   */
  protected readonly prefillMode = signal(false);

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly submitted = signal(false);

  // ── Form signals ──────────────────────────────────────────────────────────

  protected readonly rcptdate = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly autoNumbering = signal(true);
  protected readonly number = signal('Auto Number');
  protected readonly receiptNumber = signal('');
  protected readonly amount = signal('');
  protected readonly currencycode = signal('');
  protected readonly conversionrate = signal('1');
  protected readonly description = signal('');
  private readonly customProperties = signal<CustomerReceipt['cprops']>({});
  protected readonly numberEnabled = computed(() => !this.autoNumbering());

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly customerid = signal('');
  protected readonly customerQuery = signal('');

  protected readonly filteredCustomers = computed<Customer[]>(() => {
    const list = this.customerStore.items() as Customer[];
    return list.slice(0, 15);
  });

  protected readonly customerOptionValue = (c: Customer): string => c.id ?? '';
  protected readonly customerOptionLabel = (c: Customer): string => c.name ?? '';
  protected readonly customerTrackBy = (_index: number, c: Customer): string => c.id ?? '';

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

  protected readonly selectedBankCash = signal<BankCash | null>(null);
  protected readonly bcashid = signal('');
  protected readonly bankCashQuery = signal('');

  protected readonly filteredBankCashes = computed<BankCash[]>(() => {
    const list = this.bankCashStore.items() as BankCash[];
    return list.slice(0, 15);
  });

  protected readonly bankCashOptionValue = (b: BankCash): string => b.id ?? '';
  protected readonly bankCashOptionLabel = (b: BankCash): string => b.name ?? '';
  protected readonly bankCashTrackBy = (_index: number, b: BankCash): string => b.id ?? '';

  // ── Currency autocomplete ──────────────────────────────────────────────────

  protected readonly currencyQuery = signal('');

  protected readonly filteredCurrencies = computed<Currency[]>(() =>
    this.filterCurrencies(this.currencyStore.currencies(), this.currencyQuery()),
  );

  protected readonly currencyOptionValue = (c: Currency): string => c.code;
  protected readonly currencyOptionLabel = (c: Currency): string => `${c.name} (${c.symbol})`;
  protected readonly currencyTrackBy = (_index: number, c: Currency): string => c.code;

  protected readonly branchCurrencyCode = computed(
    () => this.userSessionStore.session()?.branch?.currencycode ?? '',
  );
  protected readonly showConversionRate = computed(() => {
    const branchCurrency = this.branchCurrencyCode();
    const receiptCurrency = this.currencycode();
    return !!branchCurrency && !!receiptCurrency && receiptCurrency !== branchCurrency;
  });
  protected readonly receiptCurrencySymbol = computed(
    () =>
      this.currencyStore.currencies().find((c) => c.code === this.currencycode())?.symbol ??
      this.currencycode(),
  );
  protected readonly branchCurrencySymbol = computed(
    () =>
      this.currencyStore.currencies().find((c) => c.code === this.branchCurrencyCode())?.symbol ??
      this.branchCurrencyCode(),
  );
  protected readonly convertedAmount = computed(() => {
    const amount = Number(this.amount());
    const rate = Number(this.conversionrate());
    return Number.isFinite(amount) && Number.isFinite(rate) ? amount * rate : 0;
  });
  protected readonly conversionRateSummary = computed(() => {
    const rate = Number(this.conversionrate());
    if (!this.showConversionRate() || !Number.isFinite(rate) || rate <= 0) return '';
    const unit =
      this.receiptCurrencySymbol() === this.currencycode()
        ? `1 ${this.currencycode()}`
        : `1${this.receiptCurrencySymbol()}`;
    const amount = Number(this.amount());
    const convertedAmount = Number.isFinite(amount) ? this.convertedAmount().toFixed(2) : '0.00';
    return `${unit} = ${rate.toFixed(2)} ${this.branchCurrencyCode()}`;
  });
  protected readonly convertedAmountSummary = computed(() => {
    if (!this.showConversionRate()) return '';
    const amount = Number(this.amount());
    const rate = Number(this.conversionrate());
    if (!Number.isFinite(amount) || !Number.isFinite(rate) || rate <= 0) return '';
    return `Amount: ${this.branchCurrencySymbol()} ${this.convertedAmount().toFixed(2)}`;
  });

  // ── Invoice rows (two-way bound to child RcptInvoiceLinesComponent) ──────

  protected readonly invoiceRows = signal<InvoiceRow[]>([]);

  // ── Errors ────────────────────────────────────────────────────────────────

  protected readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.rcptdate()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.rcptdate(), 'Receipt date');
  });
  protected readonly numberError = computed(() =>
    this.submitted() && !this.autoNumbering() && this.number().trim() === ''
      ? 'Receipt number is required.'
      : null,
  );
  protected readonly customerError = computed(() =>
    this.submitted() && !this.customerid() ? 'Customer is required.' : null,
  );
  protected readonly amountError = computed(() => {
    if (!this.submitted()) return null;
    const v = Number(this.amount());
    if (!this.amount()) return 'Amount is required.';
    if (v <= 0) return 'Amount must be greater than 0.';
    return null;
  });
  protected readonly bankCashError = computed(() =>
    this.submitted() && !this.bcashid() ? 'Bank/Cash account is required.' : null,
  );
  protected readonly currencyError = computed(() =>
    this.submitted() && !this.currencycode().trim() ? 'Currency is required.' : null,
  );
  protected readonly conversionRateError = computed(() => {
    if (!this.showConversionRate()) return null;

    const value = this.conversionrate().trim();
    if (!value) return 'Conversion rate is required.';

    const rate = Number(value);
    return Number.isFinite(rate) && rate > 0
      ? null
      : 'Conversion rate must be greater than 0.';
  });

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const basicCompleted =
      (this.autoNumbering() || this.number().trim().length > 0) &&
      !!this.rcptdate() &&
      !!this.customerid() &&
      !!this.amount() &&
      Number(this.amount()) > 0 &&
      !!this.bcashid() &&
      !!this.currencycode().trim() &&
      this.conversionRateError() === null;

    const invoicesLinked = this.invoiceRows().some((r) => r.invoice !== null); // driven by child via two-way binding

    return [
      {
        value: 'basic',
        label: 'Basic Details',
        description: 'Number, date, customer, amount & bank',
        completed: basicCompleted,
      },
      {
        value: 'invoices',
        label: 'Related Invoices',
        description: 'Link to sale invoices',
        completed: invoicesLinked,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'invoices';
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private filterCurrencies(currencies: readonly Currency[], query: string): Currency[] {
    if (!query) return [...currencies];
    return currencies.filter((c) => this.currencyOptionLabel(c).toLowerCase().includes(query));
  }

  private async loadInitialState(): Promise<void> {
    this.customerReceiptStore.clearError();

    await Promise.all([
      this.customerStore.loadCustomers({}),
      this.bankCashStore.loadBankCashes({}),
      this.currencyStore.load(),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const receipt = await this.customerReceiptStore.loadCustomerReceiptById(id, {
        includes: [
          'customer',
          'bcash',
          { relation: 'invoices', scope: { include: [{ relation: 'saleinvoice' }] } },
        ],
      });
      if (receipt) this.patchFromReceipt(receipt);
      return;
    }

    // ── Create mode: check for pre-fill from a sale invoice ──────────────────
    const saleinvoiceid = this.route.snapshot.queryParamMap.get('saleinvoiceid');

    if (saleinvoiceid) {
      // Fast path: list page set selectedItem before navigating — use it directly.
      const cached = this.saleInvoiceStore.selectedItem();
      if (cached?.id === saleinvoiceid) {
        this.saleInvoiceStore.clearSelectedItem();
        this.applyInvoicePrefill(cached);
      } else {
        // Fallback: user opened the URL directly (bookmark, shared link).
        const invoice = await this.saleInvoiceStore.loadSaleInvoiceById(saleinvoiceid, {
          includes: ['customer'],
        });
        if (invoice) this.applyInvoicePrefill(invoice);
      }
    } else {
      // Set default currency after options are loaded so the autocomplete
      // can resolve the label (Name + Symbol) instead of showing the raw code.
      this.currencycode.set('INR');
    }
  }

  private applyInvoicePrefill(invoice: SaleInvoice): void {
    this.currencycode.set(invoice.currencycode ?? 'INR');
    this.conversionrate.set(String(invoice.cprops?.fx ?? 1));

    // Remaining balance = grand total minus whatever has already been received.
    const received = invoice.receipts?.reduce((sum, r) => sum + r.amount, 0) ?? 0;
    const remaining = Math.max((invoice.grandtotal ?? 0) - received, 0);
    this.amount.set((remaining || invoice.grandtotal || 0).toFixed(2));

    // Customer — prefer embedded relation, fall back to the already-loaded list.
    const customer =
      (invoice.customer as Customer | undefined) ??
      (this.customerStore.items() as Customer[]).find((c) => c.id === invoice.customerid) ??
      null;

    if (customer) {
      this.selectedCustomer.set(customer);
      this.customerid.set(customer.id ?? '');
    } else if (invoice.customerid) {
      this.customerid.set(invoice.customerid);
    }

    // Pre-fill the invoice row.
    const rowAmount = remaining || (invoice.grandtotal ?? 0);
    this.invoiceRows.set([{ invoice, invoiceSearch: invoice.number ?? '', amount: rowAmount }]);

    // Suppress RcptInvoiceLinesComponent's auto-load effect so it doesn't
    // overwrite the row we just set when customerid is applied.
    this.prefillMode.set(true);
  }

  // ── Patch signals from loaded receipt (edit mode) ─────────────────────────

  private patchFromReceipt(r: CustomerReceipt): void {
    const auto = r.cprops?.autoNumbering ?? false;
    this.customProperties.set(r.cprops ?? {});
    this.receiptNumber.set(r.number ?? '');
    this.autoNumbering.set(auto);
    this.number.set(auto ? (r.number ?? 'Auto Number') : (r.number ?? ''));
    this.rcptdate.set(r.date ?? this.fiscalYearDateRange.defaultDate());
    this.amount.set(String(r.amount ?? ''));
    this.currencycode.set(r.currencycode ?? 'INR');
    this.conversionrate.set(String(r.cprops?.fx ?? 1));
    this.description.set(r.description ?? '');
    this.customerid.set(r.customerid ?? r.customer?.id ?? '');

    if (r.customer) {
      this.selectedCustomer.set(r.customer as Customer);
    }

    if (r.bcash) {
      this.selectedBankCash.set(r.bcash as BankCash);
      this.bcashid.set(r.bcash.id ?? '');
    } else if (r.bcashid) {
      this.bcashid.set(r.bcashid);
    }

    if (r.invoices?.length) {
      this.invoiceRows.set(
        r.invoices.map((inv) => ({
          invoice: (inv.saleinvoice as SaleInvoice) ?? null,
          // invoiceSearch is just the search-input string; the child resolves
          // the full display label via getOptionLabel once the invoice is set.
          invoiceSearch: (inv.saleinvoice as SaleInvoice)?.number ?? '',
          amount: inv.amount,
        })),
      );
    }
  }

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected onCustomerQueryChange(event: unknown): void {
    const q = typeof event === 'string' ? event.trim() : '';
    this.customerQuery.set(q);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
      this.invoiceRows.set([]);
    }
    if (this.customerSearchTimer) clearTimeout(this.customerSearchTimer);
    this.customerSearchTimer = setTimeout(() => {
      void this.customerStore.loadCustomers(
        q
          ? {
              where: {
                or: [
                  { name: { ilike: `%${q}%` } },
                  { mobile: { ilike: `%${q}%` } },
                  { email: { ilike: `%${q}%` } },
                ],
              },
            }
          : {},
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onCustomerValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
      return;
    }
    const customer = this.filteredCustomers().find((c) => c.id === id) ?? null;
    if (!customer) return;

    this.selectedCustomer.set(customer);
    this.customerid.set(customer.id ?? '');
    this.currencycode.set(customer.currencycode ?? this.currencycode());
    // Invoice pre-fill is handled by RcptInvoiceLinesComponent via its effect()
  }

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

  protected onCurrencyQueryChange(event: unknown): void {
    this.currencyQuery.set(typeof event === 'string' ? event.trim().toLowerCase() : '');
  }

  protected onCurrencyValueChange(value: unknown): void {
    const code = typeof value === 'string' ? value : '';
    if (code) this.currencycode.set(code);
  }

  protected onBankCashQueryChange(event: unknown): void {
    const q = typeof event === 'string' ? event.trim() : '';
    this.bankCashQuery.set(q);
    if (!q) {
      this.selectedBankCash.set(null);
      this.bcashid.set('');
    }
    if (this.bankCashSearchTimer) clearTimeout(this.bankCashSearchTimer);
    this.bankCashSearchTimer = setTimeout(() => {
      void this.bankCashStore.loadBankCashes(q ? { where: { name: { ilike: `%${q}%` } } } : {});
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onBankCashValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) {
      this.selectedBankCash.set(null);
      this.bcashid.set('');
      return;
    }
    const bcash = this.filteredBankCashes().find((b) => b.id === id) ?? null;
    if (bcash) {
      this.selectedBankCash.set(bcash);
      this.bcashid.set(bcash.id ?? '');
    }
  }

  // ── Date helpers ──────────────────────────────────────────────────────────

  protected onDateChange(value: unknown): void {
    if (typeof value === 'string') this.rcptdate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid()) this.rcptdate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.rcptdate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
  }

  protected toggleAutoNumbering(value: boolean): void {
    this.autoNumbering.set(value);
    if (value) {
      this.number.set(this.receiptNumber() || 'Auto Number');
      return;
    }

    if (this.number() === 'Auto Number') {
      this.number.set('');
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    const amountVal = Number(this.amount());
    if (
      this.numberError() !== null ||
      this.dateError() !== null ||
      !this.customerid() ||
      !this.amount() ||
      amountVal <= 0 ||
      !this.bcashid() ||
      !this.currencycode().trim() ||
      this.conversionRateError() !== null
    ) {
      return;
    }

    const cprops = {
      ...(this.customProperties() ?? {}),
      autoNumbering: this.autoNumbering(),
      ...(this.showConversionRate()
        ? {
            fx: Number(this.conversionrate()),
            lamt: this.convertedAmount(),
          }
        : {}),
    };

    const invoices: CustomerReceiptInvoiceRequest[] = this.invoiceRows()
      .filter((r) => r.invoice?.id)
      .map((r) => ({
        saleinvoiceid: r.invoice!.id!,
        amount: r.amount,
      }));

    const payload: CustomerReceiptPayload = {
      ...(!this.autoNumbering() && this.number().trim() ? { number: this.number().trim() } : {}),
      date: this.rcptdate(),
      amount: amountVal,
      currencycode: this.currencycode().trim(),
      customerid: this.customerid(),
      bcashid: this.bcashid(),
      cprops,
      ...(this.description().trim() ? { description: this.description().trim() } : {}),
      ...(invoices.length ? { invoices } : {}),
    };

    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
    }
  }
}
