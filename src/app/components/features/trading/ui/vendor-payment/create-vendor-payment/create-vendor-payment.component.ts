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
  TngTextareaComponent,
} from '@tailng-ui/components';
import dayjs from 'dayjs';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../data/bank-cash';
import type { Currency } from '../../../../../features/management/data/currency/currency.model';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';
import type { Vendor } from '../../../data/vendor/vendor.model';
import { VendorStore } from '../../../data/vendor';
import type {
  VendorPayment,
  VendorPaymentInvoiceRequest,
  VendorPaymentPayload,
} from '../../../data/vendor-payment';
import { VendorPaymentFacade, VendorPaymentStore } from '../../../data/vendor-payment';
import type { PurchaseInvoice } from '../../../data/purchase-invoice/purchase-invoice.model';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import {
  InvoiceRow,
  VpmtInvoiceLinesComponent,
} from './vpmt-invoice-lines/vpmt-invoice-lines.component';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-vendor-payment',
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
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    VpmtInvoiceLinesComponent,
  ],
  templateUrl: './create-vendor-payment.component.html',
  styleUrl: './create-vendor-payment.component.css',
})
export class CreateVendorPaymentComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(VendorPaymentFacade);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  protected readonly vendorPaymentStore = inject(VendorPaymentStore);
  protected readonly vendorStore = inject(VendorStore);
  protected readonly bankCashStore = inject(BankCashStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private vendorSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Vendor Payment' : 'New Vendor Payment',
  );

  /**
   * Set to true when the form is pre-filled from a purchase-invoice query param so
   * that VpmtInvoiceLinesComponent's auto-load effect does not overwrite the row.
   */
  protected readonly prefillMode = signal(false);

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly submitted = signal(false);

  // ── Form signals ──────────────────────────────────────────────────────────

  protected readonly pmtdate = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly amount = signal('');
  protected readonly currencycode = signal('');
  protected readonly description = signal('');

  // ── Vendor autocomplete ───────────────────────────────────────────────────

  protected readonly selectedVendor = signal<Vendor | null>(null);
  protected readonly vendorid = signal('');
  protected readonly vendorQuery = signal('');

  protected readonly filteredVendors = computed<Vendor[]>(() => {
    const list = this.vendorStore.items() as Vendor[];
    return list.slice(0, 15);
  });

  protected readonly vendorOptionValue = (v: Vendor): string => v.id ?? '';
  protected readonly vendorOptionLabel = (v: Vendor): string => v.name ?? '';
  protected readonly vendorTrackBy = (_index: number, v: Vendor): string => v.id ?? '';

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

  // ── Invoice rows (two-way bound to child VpmtInvoiceLinesComponent) ───────

  protected readonly invoiceRows = signal<InvoiceRow[]>([]);

  // ── Errors ────────────────────────────────────────────────────────────────

  protected readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.pmtdate()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.pmtdate(), 'Payment date');
  });
  protected readonly vendorError = computed(() =>
    this.submitted() && !this.vendorid() ? 'Vendor is required.' : null,
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

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const basicCompleted =
      !!this.pmtdate() &&
      !!this.vendorid() &&
      !!this.amount() &&
      Number(this.amount()) > 0 &&
      !!this.bcashid() &&
      !!this.currencycode().trim();

    const invoicesLinked = this.invoiceRows().some((r) => r.invoice !== null);

    return [
      {
        value: 'basic',
        label: 'Basic Details',
        description: 'Date, vendor, amount & bank',
        completed: basicCompleted,
      },
      {
        value: 'invoices',
        label: 'Related Invoices',
        description: 'Link to purchase invoices',
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
    this.vendorPaymentStore.clearError();

    await Promise.all([
      this.vendorStore.loadVendors({}),
      this.bankCashStore.loadBankCashes({}),
      this.currencyStore.load(),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const payment = await this.vendorPaymentStore.loadVendorPaymentById(id, {
        includes: [
          'vendor',
          'bcash',
          { relation: 'invoices', scope: { include: [{ relation: 'purchaseinvoice' }] } },
        ],
      });
      if (payment) this.patchFromPayment(payment);
      return;
    }

    // ── Create mode: check for pre-fill from a purchase invoice ──────────────
    const purchaseinvoiceid = this.route.snapshot.queryParamMap.get('purchaseinvoiceid');

    if (purchaseinvoiceid) {
      // Fast path: list page set selectedItem before navigating — use it directly.
      const cached = this.purchaseInvoiceStore.selectedItem();
      if (cached?.id === purchaseinvoiceid) {
        this.purchaseInvoiceStore.clearSelectedItem();
        this.applyInvoicePrefill(cached);
      } else {
        // Fallback: user opened the URL directly (bookmark, shared link).
        const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(purchaseinvoiceid, {
          includes: ['vendor'],
        });
        if (invoice) this.applyInvoicePrefill(invoice);
      }
    } else {
      // Set default currency after options are loaded so the autocomplete
      // can resolve the label (Name + Symbol) instead of showing the raw code.
      this.currencycode.set('INR');
    }
  }

  private applyInvoicePrefill(invoice: PurchaseInvoice): void {
    this.currencycode.set(invoice.currencycode ?? 'INR');

    // Remaining balance = grand total minus whatever has already been paid.
    const paid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    const remaining = Math.max((invoice.grandtotal ?? 0) - paid, 0);
    this.amount.set((remaining || invoice.grandtotal || 0).toFixed(2));

    // Vendor — prefer embedded relation, fall back to the already-loaded list.
    const vendor =
      (invoice.vendor as Vendor | undefined) ??
      (this.vendorStore.items() as Vendor[]).find((v) => v.id === invoice.vendorid) ??
      null;

    if (vendor) {
      this.selectedVendor.set(vendor);
      this.vendorid.set(vendor.id ?? '');
    } else if (invoice.vendorid) {
      this.vendorid.set(invoice.vendorid);
    }

    // Pre-fill the invoice row.
    const rowAmount = remaining || (invoice.grandtotal ?? 0);
    this.invoiceRows.set([{ invoice, invoiceSearch: invoice.number ?? '', amount: rowAmount }]);

    // Suppress VpmtInvoiceLinesComponent's auto-load effect so it doesn't
    // overwrite the row we just set when vendorid is applied.
    this.prefillMode.set(true);
  }

  // ── Patch signals from loaded payment (edit mode) ─────────────────────────

  private patchFromPayment(p: VendorPayment): void {
    this.pmtdate.set(p.date ?? this.fiscalYearDateRange.defaultDate());
    this.amount.set(String(p.amount ?? ''));
    this.currencycode.set(p.currencycode ?? 'INR');
    this.description.set(p.description ?? '');
    this.vendorid.set(p.vendorid ?? p.vendor?.id ?? '');

    if (p.vendor) {
      this.selectedVendor.set(p.vendor as Vendor);
    }

    if (p.bcash) {
      this.selectedBankCash.set(p.bcash as BankCash);
      this.bcashid.set(p.bcash.id ?? '');
    } else if (p.bcashid) {
      this.bcashid.set(p.bcashid);
    }

    if (p.invoices?.length) {
      this.invoiceRows.set(
        p.invoices.map((inv) => ({
          invoice: (inv.purchaseinvoice as PurchaseInvoice) ?? null,
          invoiceSearch: (inv.purchaseinvoice as PurchaseInvoice)?.number ?? '',
          amount: inv.amount,
        })),
      );
    }
  }

  // ── Vendor autocomplete ───────────────────────────────────────────────────

  protected onVendorQueryChange(event: unknown): void {
    const q = typeof event === 'string' ? event.trim() : '';
    this.vendorQuery.set(q);
    if (!q) {
      this.selectedVendor.set(null);
      this.vendorid.set('');
      this.invoiceRows.set([]);
    }
    if (this.vendorSearchTimer) clearTimeout(this.vendorSearchTimer);
    this.vendorSearchTimer = setTimeout(() => {
      void this.vendorStore.loadVendors(
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

  protected onVendorValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) {
      this.selectedVendor.set(null);
      this.vendorid.set('');
      return;
    }
    const vendor = this.filteredVendors().find((v) => v.id === id) ?? null;
    if (!vendor) return;

    this.selectedVendor.set(vendor);
    this.vendorid.set(vendor.id ?? '');
    this.currencycode.set(vendor.currencycode ?? this.currencycode());
    // Invoice pre-fill is handled by VpmtInvoiceLinesComponent via its effect()
  }

  // ── Currency autocomplete ──────────────────────────────────────────────────

  protected onCurrencyQueryChange(event: unknown): void {
    this.currencyQuery.set(typeof event === 'string' ? event.trim().toLowerCase() : '');
  }

  protected onCurrencyValueChange(value: unknown): void {
    const code = typeof value === 'string' ? value : '';
    if (code) this.currencycode.set(code);
  }

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

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
    if (typeof value === 'string') this.pmtdate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid()) this.pmtdate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.pmtdate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    const amountVal = Number(this.amount());
    if (
      this.dateError() !== null ||
      !this.vendorid() ||
      !this.amount() ||
      amountVal <= 0 ||
      !this.bcashid() ||
      !this.currencycode().trim()
    ) {
      return;
    }

    const invoices: VendorPaymentInvoiceRequest[] = this.invoiceRows()
      .filter((r) => r.invoice?.id)
      .map((r) => ({
        purchaseinvoiceid: r.invoice!.id!,
        amount: r.amount,
      }));

    const payload: VendorPaymentPayload = {
      date: this.pmtdate(),
      amount: amountVal,
      currencycode: this.currencycode().trim(),
      vendorid: this.vendorid(),
      bcashid: this.bcashid(),
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
