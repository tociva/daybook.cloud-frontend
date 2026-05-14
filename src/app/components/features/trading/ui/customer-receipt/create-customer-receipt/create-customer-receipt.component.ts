import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngInputComponent,
  TngLabelComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import dayjs from 'dayjs';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { BankCashStore } from '../../../data/bank-cash';
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
  showDropdown: boolean;
  amount: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-customer-receipt',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngInputComponent,
    TngIcon,
    TngLabelComponent,
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
  protected readonly currencycode = signal('INR');
  protected readonly description = signal('');

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected readonly customerSearch = signal('');
  protected readonly showCustomerDropdown = signal(false);
  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly customerid = signal('');

  protected readonly filteredCustomers = computed<Customer[]>(() => {
    const q = this.customerSearch().toLowerCase();
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

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

  protected readonly bankCashSearch = signal('');
  protected readonly showBankCashDropdown = signal(false);
  protected readonly selectedBankCash = signal<BankCash | null>(null);
  protected readonly bcashid = signal('');

  protected readonly filteredBankCashes = computed<BankCash[]>(() => {
    const q = this.bankCashSearch().toLowerCase();
    const list = this.bankCashStore.items() as BankCash[];
    return (q ? list.filter((b) => b.name?.toLowerCase().includes(q)) : list).slice(0, 15);
  });

  // ── Invoice rows ──────────────────────────────────────────────────────────

  protected readonly invoiceRows = signal<InvoiceRow[]>([this.emptyInvoiceRow()]);
  protected readonly activeInvoiceRowIndex = signal(-1);

  protected readonly filteredInvoices = computed<SaleInvoice[]>(
    () => this.saleInvoiceStore.items().slice(0, 15) as SaleInvoice[],
  );

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

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    await Promise.all([
      this.customerStore.loadCustomers({}),
      this.bankCashStore.loadBankCashes({}),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

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
      this.customerSearch.set(r.customer.name ?? '');
    }

    if (r.bcash) {
      this.selectedBankCash.set(r.bcash as BankCash);
      this.bankCashSearch.set(r.bcash.name ?? '');
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
          showDropdown: false,
          amount: inv.amount,
        })),
      );
    }
  }

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected onCustomerSearchInput(value: string | null): void {
    const q = value ?? '';
    this.customerSearch.set(q);
    this.showCustomerDropdown.set(true);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
    }
    void this.customerStore.loadCustomers(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerSearch.set(customer.name);
    this.customerid.set(customer.id ?? '');
    this.showCustomerDropdown.set(false);
    this.currencycode.set(customer.currencycode ?? this.currencycode());
    // Reset invoice rows when customer changes
    this.invoiceRows.set([this.emptyInvoiceRow()]);
  }

  protected closeCustomerDropdown(): void {
    this.showCustomerDropdown.set(false);
  }

  // ── Bank/Cash autocomplete ────────────────────────────────────────────────

  protected onBankCashSearchInput(value: string | null): void {
    const q = value ?? '';
    this.bankCashSearch.set(q);
    this.showBankCashDropdown.set(true);
    if (!q) {
      this.selectedBankCash.set(null);
      this.bcashid.set('');
    }
    void this.bankCashStore.loadBankCashes(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  protected selectBankCash(bcash: BankCash): void {
    this.selectedBankCash.set(bcash);
    this.bankCashSearch.set(bcash.name);
    this.bcashid.set(bcash.id ?? '');
    this.showBankCashDropdown.set(false);
  }

  protected closeBankCashDropdown(): void {
    this.showBankCashDropdown.set(false);
  }

  // ── Invoice row management ────────────────────────────────────────────────

  private emptyInvoiceRow(): InvoiceRow {
    return { invoice: null, invoiceSearch: '', showDropdown: false, amount: 0 };
  }

  protected addInvoiceRow(): void {
    this.invoiceRows.update((rows) => [...rows, this.emptyInvoiceRow()]);
  }

  protected removeInvoiceRow(index: number): void {
    this.invoiceRows.update((rows) => {
      const next = rows.filter((_, i) => i !== index);
      return next.length ? next : [this.emptyInvoiceRow()];
    });
  }

  protected onInvoiceSearchInput(value: string | null, rowIndex: number): void {
    const q = value ?? '';
    this.invoiceRows.update((rows) =>
      rows.map((row, i) =>
        i === rowIndex ? { ...row, invoiceSearch: q, showDropdown: true } : row,
      ),
    );
    this.activeInvoiceRowIndex.set(rowIndex);
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

  protected selectInvoice(invoice: SaleInvoice, rowIndex: number): void {
    this.invoiceRows.update((rows) =>
      rows.map((row, i) =>
        i === rowIndex
          ? {
              ...row,
              invoice,
              invoiceSearch: this.invoiceDisplayName(invoice),
              showDropdown: false,
            }
          : row,
      ),
    );
    this.activeInvoiceRowIndex.set(-1);
  }

  protected closeInvoiceDropdown(): void {
    this.activeInvoiceRowIndex.set(-1);
  }

  protected updateInvoiceAmount(rowIndex: number, value: string | null): void {
    const num = Number(value ?? '0') || 0;
    this.invoiceRows.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, amount: num } : row)),
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

  protected getInvoiceRowDisplayName(row: InvoiceRow): string {
    return row.invoice ? this.invoiceDisplayName(row.invoice) : row.invoiceSearch;
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
