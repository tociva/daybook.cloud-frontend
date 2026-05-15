import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import dayjs from 'dayjs';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../data/bank-cash';
import type { Currency } from '../../../../../features/management/data/currency/currency.model';
import { CurrencyStore } from '../../../../../features/management/data/currency/currency.store';
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
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import {
  FiscalYearDatepickerComponent,
  FiscalYearDateRangeService,
} from '../../../../../../shared/fiscal-year-datepicker';

// ── Internal row type ─────────────────────────────────────────────────────────

interface InvoiceRow {
  invoice: SaleInvoice | null;
  invoiceSearch: string;
  amount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-customer-receipt',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngInputComponent,
    TngIcon,
    TngLabelComponent,
    TngStepperComponent,
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-customer-receipt.component.html',
  styleUrl: './create-customer-receipt.component.css',
})
export class CreateCustomerReceiptComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CustomerReceiptFacade);
  private readonly dateManagement = inject(DateManagementService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  protected readonly customerReceiptStore = inject(CustomerReceiptStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private readonly currencyStore = inject(CurrencyStore);

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Customer Receipt' : 'New Customer Receipt',
  );

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly submitted = signal(false);

  // ── Form signals ──────────────────────────────────────────────────────────

  protected readonly rcptdate = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly amount = signal('');
  protected readonly currencycode = signal('');
  protected readonly description = signal('');

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly customerid = signal('');
  protected readonly customerQuery = signal('');

  protected readonly filteredCustomers = computed<Customer[]>(() => {
    const q = this.customerQuery().toLowerCase();
    const list = this.customerStore.items() as Customer[];
    return (
      q
        ? list.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.mobile?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q),
          )
        : list
    ).slice(0, 15);
  });

  protected readonly customerOptionValue = (c: Customer): string => c.id ?? '';
  protected readonly customerOptionLabel = (c: Customer): string => c.name ?? '';
  protected readonly customerTrackBy = (_index: number, c: Customer): string => c.id ?? '';

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

  protected readonly selectedBankCash = signal<BankCash | null>(null);
  protected readonly bcashid = signal('');
  protected readonly bankCashQuery = signal('');

  protected readonly filteredBankCashes = computed<BankCash[]>(() => {
    const q = this.bankCashQuery().toLowerCase();
    const list = this.bankCashStore.items() as BankCash[];
    return (q ? list.filter((b) => b.name?.toLowerCase().includes(q)) : list).slice(0, 15);
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

  // ── Invoice rows ──────────────────────────────────────────────────────────

  protected readonly invoiceRows = signal<InvoiceRow[]>([this.emptyInvoiceRow()]);

  protected readonly filteredInvoices = computed<SaleInvoice[]>(() => {
    const customerId = this.customerid();
    const items = this.saleInvoiceStore.items() as SaleInvoice[];
    return (customerId ? items.filter((inv) => inv.customerid === customerId) : items).slice(0, 15);
  });

  protected readonly invoiceOptionValue = (inv: SaleInvoice): string => inv.id ?? '';
  protected readonly invoiceOptionLabel = (inv: SaleInvoice): string =>
    this.invoiceDisplayName(inv);
  protected readonly invoiceTrackBy = (_index: number, inv: SaleInvoice): string => inv.id ?? '';

  // ── Computed total ────────────────────────────────────────────────────────

  protected readonly invoicesTotal = computed(() =>
    this.invoiceRows()
      .reduce((s, r) => s + (Number(r.amount) || 0), 0)
      .toFixed(2),
  );

  // ── Errors ────────────────────────────────────────────────────────────────

  protected readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.rcptdate()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.rcptdate(), 'Receipt date');
  });
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

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const basicCompleted =
      !!this.rcptdate() &&
      !!this.customerid() &&
      !!this.amount() &&
      Number(this.amount()) > 0 &&
      !!this.bcashid() &&
      !!this.currencycode().trim();

    const invoicesLinked = this.invoiceRows().some((r) => r.invoice !== null);

    return [
      {
        value: 'basic',
        label: 'Basic Details',
        description: 'Date, customer, amount & bank',
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
    await Promise.all([
      this.customerStore.loadCustomers({}),
      this.bankCashStore.loadBankCashes({}),
      this.currencyStore.load(),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      // Set default currency after options are loaded so the autocomplete
      // can resolve the label (Name + Symbol) instead of showing the raw code.
      this.currencycode.set('INR');
    }

    if (id) {
      const receipt = await this.customerReceiptStore.loadCustomerReceiptById(id, {
        includes: ['customer', 'bcash', 'invoices.saleinvoice'],
      });
      if (receipt) this.patchFromReceipt(receipt);
    }
  }

  // ── Patch signals from loaded receipt (edit mode) ─────────────────────────

  private patchFromReceipt(r: CustomerReceipt): void {
    this.rcptdate.set(r.date ?? this.fiscalYearDateRange.defaultDate());
    this.amount.set(String(r.amount ?? ''));
    this.currencycode.set(r.currencycode ?? 'INR');
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
          invoiceSearch: inv.saleinvoice
            ? this.invoiceDisplayName(inv.saleinvoice as SaleInvoice)
            : '',
          amount: inv.amount,
        })),
      );
    }
  }

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected onCustomerQueryChange(event: unknown): void {
    const q = typeof event === 'string' ? event : '';
    this.customerQuery.set(q);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
      this.invoiceRows.set([this.emptyInvoiceRow()]);
    }
    void this.customerStore.loadCustomers(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected onCustomerValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
      return;
    }
    const customer = this.filteredCustomers().find((c) => c.id === id) ?? null;
    if (customer) {
      this.selectedCustomer.set(customer);
      this.customerid.set(customer.id ?? '');
      this.currencycode.set(customer.currencycode ?? this.currencycode());
      // Reset invoice rows when customer changes
      this.invoiceRows.set([this.emptyInvoiceRow()]);
      // Load invoices for this customer
      void this.saleInvoiceStore.loadSaleInvoices({ where: { customerid: customer.id } });
    }
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
    const q = typeof event === 'string' ? event : '';
    this.bankCashQuery.set(q);
    if (!q) {
      this.selectedBankCash.set(null);
      this.bcashid.set('');
    }
    void this.bankCashStore.loadBankCashes(q ? { where: { name: { ilike: `%${q}%` } } } : {});
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

  // ── Invoice row management ────────────────────────────────────────────────

  private emptyInvoiceRow(): InvoiceRow {
    return { invoice: null, invoiceSearch: '', amount: 0 };
  }

  protected addInvoiceRow(): void {
    this.invoiceRows.update((rows) => [...rows, this.emptyInvoiceRow()]);
  }

  protected removeInvoiceRow(row: InvoiceRow): void {
    this.invoiceRows.update((rows) => {
      const next = rows.filter((r) => r !== row);
      return next.length ? next : [this.emptyInvoiceRow()];
    });
  }

  protected onInvoiceQueryChange(event: unknown, row: InvoiceRow): void {
    const q = typeof event === 'string' ? event : '';
    const idx = this.invoiceRows().indexOf(row);
    if (idx === -1) return;
    this.invoiceRows.update((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, invoiceSearch: q } : r)),
    );
    const customerId = this.customerid();
    void this.saleInvoiceStore.loadSaleInvoices(
      q
        ? {
            where: {
              and: [
                { number: { ilike: `%${q}%` } },
                ...(customerId ? [{ customerid: customerId }] : []),
              ],
            },
          }
        : customerId
          ? { where: { customerid: customerId } }
          : {},
    );
  }

  protected onInvoiceValueChange(value: unknown, row: InvoiceRow): void {
    const id = typeof value === 'string' ? value : '';
    const idx = this.invoiceRows().indexOf(row);
    if (idx === -1) return;
    if (!id) {
      this.invoiceRows.update((rows) =>
        rows.map((r, i) => (i === idx ? { ...r, invoice: null, invoiceSearch: '' } : r)),
      );
      return;
    }
    const invoice = this.filteredInvoices().find((inv) => inv.id === id) ?? null;
    if (invoice) {
      this.invoiceRows.update((rows) =>
        rows.map((r, i) =>
          i === idx ? { ...r, invoice, invoiceSearch: this.invoiceDisplayName(invoice) } : r,
        ),
      );
    }
  }

  protected updateInvoiceAmount(row: InvoiceRow, value: string | null): void {
    const num = Number(value ?? '0') || 0;
    const idx = this.invoiceRows().indexOf(row);
    if (idx === -1) return;
    this.invoiceRows.update((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, amount: num } : r)),
    );
  }

  protected invoiceDisplayName(invoice: SaleInvoice): string {
    const parts: string[] = [];
    if (invoice.number) parts.push(invoice.number);
    const formattedDate = this.dateManagement.formatDisplayDate(invoice.date, '');
    if (formattedDate) parts.push(`dated ${formattedDate}`);
    if (invoice.grandtotal != null)
      parts.push(`(${this.currencycode()} ${invoice.grandtotal.toFixed(2)})`);
    return parts.join(' ');
  }

  // ── Date helpers ──────────────────────────────────────────────────────────

  protected onDateChange(value: unknown): void {
    if (typeof value === 'string') this.rcptdate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid()) this.rcptdate.set(value.format('YYYY-MM-DD'));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.rcptdate.set(dayjs(value).format('YYYY-MM-DD'));
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    const amountVal = Number(this.amount());
    if (
      this.dateError() !== null ||
      !this.customerid() ||
      !this.amount() ||
      amountVal <= 0 ||
      !this.bcashid() ||
      !this.currencycode().trim()
    ) {
      return;
    }

    const invoices: CustomerReceiptInvoiceRequest[] = this.invoiceRows()
      .filter((r) => r.invoice?.id)
      .map((r) => ({
        saleinvoiceid: r.invoice!.id!,
        amount: r.amount,
      }));

    const payload: CustomerReceiptPayload = {
      date: this.rcptdate(),
      amount: amountVal,
      currencycode: this.currencycode().trim(),
      customerid: this.customerid(),
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
