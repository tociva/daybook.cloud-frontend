import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardComponent,
  TngInputComponent,
  TngProgressSpinnerComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import dayjs from 'dayjs';
import type { Lb4Include } from '../../../../../../shared/crud';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { TableRowIconButtonComponent } from '../../../../../../shared/table-row-icon-button';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { ToastStore } from '../../../../../../core/toast/toast.store';
import {
  formatAmountForCurrency,
  formatAmountWithCurrency,
} from '../../../../../../shared/format/currency';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashStore } from '../../../data/bank-cash';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import { VendorPaymentFacade, VendorPaymentService, VendorPaymentStore } from '../../../data/vendor-payment';
import type { VendorPayment } from '../../../data/vendor-payment';
import {
  buildPurchaseInvoicePaymentPayload,
  calculatePurchaseInvoiceOutstanding,
  calculatePurchaseInvoicePaidTotal,
  getPurchaseInvoicePaymentDraftError,
  normalizePurchaseInvoicePaymentRows,
  type PurchaseInvoicePaymentDraft,
  type PurchaseInvoicePaymentRow,
} from './purchase-invoice-payments.util';

const PURCHASE_INVOICE_PAYMENTS_INCLUDES = [
  'vendor',
  'currency',
  {
    relation: 'payments',
    scope: {
      include: [
        {
          relation: 'vendorpayment',
          scope: { include: [{ relation: 'bcash' }] },
        },
      ],
    },
  },
] as const satisfies readonly Lb4Include[];

const LAST_PAYMENT_DATE_KEY_PREFIX = 'daybook:purchase-invoice-payment:last-date';

@Component({
  selector: 'app-purchase-invoice-payments-panel',
  standalone: true,
  imports: [
    FiscalYearDatepickerComponent,
    TableRowIconButtonComponent,
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardComponent,
    TngIcon,
    TngInputComponent,
    TngProgressSpinnerComponent,
    TngSwitchComponent,
    TngTextareaComponent,
  ],
  templateUrl: './purchase-invoice-payments-panel.component.html',
  styleUrl: './purchase-invoice-payments-panel.component.css',
})
export class PurchaseInvoicePaymentsPanelComponent {
  readonly invoiceId = input.required<string>();

  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly toastStore = inject(ToastStore);
  private readonly vendorPaymentFacade = inject(VendorPaymentFacade);
  private readonly vendorPaymentService = inject(VendorPaymentService);
  private readonly vendorPaymentStore = inject(VendorPaymentStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly userSession = inject(UserSessionStore);

  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);

  protected readonly paymentRows = signal<readonly PurchaseInvoicePaymentRow[]>([]);
  protected readonly fallbackPaymentsLoading = signal(false);
  protected readonly savingPayment = signal(false);
  protected readonly submitted = signal(false);

  protected readonly autoNumbering = signal(true);
  protected readonly number = signal('Auto Number');
  protected readonly paymentDate = signal('');
  protected readonly amount = signal('');
  protected readonly description = signal('');
  protected readonly selectedBankCash = signal<BankCash | null>(null);
  protected readonly bankCashId = signal('');
  protected readonly bankCashQuery = signal('');

  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly invoice = computed(() => {
    const selected = this.purchaseInvoiceStore.selectedItem();
    return selected?.id === this.invoiceId() ? selected : null;
  });
  protected readonly paidTotal = computed(() => calculatePurchaseInvoicePaidTotal(this.invoice()));
  protected readonly outstandingBalance = computed(() =>
    calculatePurchaseInvoiceOutstanding(this.invoice()),
  );
  protected readonly canAddPayment = computed(
    () => Boolean(this.invoice()?.id) && this.outstandingBalance() > 0,
  );
  protected readonly filteredBankCashes = computed<BankCash[]>(() =>
    this.withSelectedOption(
      this.bankCashStore.items() as readonly BankCash[],
      this.selectedBankCash(),
    ),
  );
  protected readonly addPaymentError = computed(() => {
    if (!this.submitted()) return null;
    const invoice = this.invoice();
    const dateError = this.getPaymentDateError();

    return getPurchaseInvoicePaymentDraftError(invoice, this.currentDraft(), { dateError });
  });

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  protected readonly bankCashOptionValue = (bankCash: BankCash): string => bankCash.id ?? '';
  protected readonly bankCashOptionLabel = (bankCash: BankCash): string => bankCash.name ?? '';
  protected readonly bankCashTrackBy = (_index: number, bankCash: BankCash): string =>
    bankCash.id ?? bankCash.name;

  constructor() {
    this.paymentDate.set(this.defaultPaymentDate());
    void this.bankCashStore.loadBankCashes({});

    effect(() => {
      const id = this.invoiceId();
      if (!id) {
        this.paymentRows.set([]);
        return;
      }

      void untracked(() => this.loadInitialState(id));
    });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected rowPaymentNumber(row: PurchaseInvoicePaymentRow): string {
    return row.number || row.paymentId || '—';
  }

  protected rowBankCashName(row: PurchaseInvoicePaymentRow): string {
    return row.bankCash?.name || row.bankCashId || '—';
  }

  protected viewPayment(row: PurchaseInvoicePaymentRow): void {
    if (!row.paymentId) return;

    void this.router.navigate(['/app/trading/vendor-payment', row.paymentId, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onPaymentDateChange(value: unknown): void {
    if (typeof value === 'string') {
      this.paymentDate.set(value);
      return;
    }
    if (dayjs.isDayjs(value) && value.isValid()) {
      this.paymentDate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
      return;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      this.paymentDate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
    }
  }

  protected toggleAutoNumbering(value: boolean): void {
    this.autoNumbering.set(value);
    if (value) {
      this.number.set('Auto Number');
      return;
    }
    if (this.number() === 'Auto Number') {
      this.number.set('');
    }
  }

  protected onBankCashQueryChange(event: unknown): void {
    const query = typeof event === 'string' ? event.trim() : '';
    this.bankCashQuery.set(query);
    if (!query) {
      this.selectedBankCash.set(null);
      this.bankCashId.set('');
    }
    if (this.bankCashSearchTimer) clearTimeout(this.bankCashSearchTimer);
    this.bankCashSearchTimer = setTimeout(() => {
      void this.bankCashStore.loadBankCashes(
        query ? { where: { name: { ilike: `%${query}%` } } } : {},
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onBankCashValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    if (!id) {
      this.selectedBankCash.set(null);
      this.bankCashId.set('');
      return;
    }

    const bankCash = this.filteredBankCashes().find((option) => option.id === id) ?? null;
    if (!bankCash) return;

    this.selectedBankCash.set(bankCash);
    this.bankCashId.set(bankCash.id ?? '');
  }

  protected async savePayment(): Promise<void> {
    this.vendorPaymentStore.clearError();
    this.submitted.set(true);
    if (this.addPaymentError() || this.savingPayment()) return;

    const invoice = this.invoice();
    if (!invoice) return;

    const payload = buildPurchaseInvoicePaymentPayload(invoice, this.currentDraft(), {
      dateError: this.getPaymentDateError(),
    });

    this.savingPayment.set(true);
    try {
      const created = await this.vendorPaymentFacade.create(payload, { navigateBack: false });
      if (!created) {
        this.toastStore.danger(this.vendorPaymentStore.error() ?? 'Failed to create vendor payment.');
        return;
      }

      if (created && invoice.id) {
        this.rememberPaymentDate();
        await this.loadInvoicePayments(invoice.id);
      }
    } finally {
      this.savingPayment.set(false);
    }
  }

  private async loadInitialState(id: string): Promise<void> {
    this.purchaseInvoiceStore.clearError();

    const selected = this.purchaseInvoiceStore.selectedItem();
    if (selected?.id !== id) {
      this.purchaseInvoiceStore.clearSelectedItem();
    }

    await this.loadInvoicePayments(id);
  }

  private async loadInvoicePayments(id: string): Promise<void> {
    const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, {
      includes: PURCHASE_INVOICE_PAYMENTS_INCLUDES,
    });
    if (!invoice) {
      this.paymentRows.set([]);
      return;
    }

    const fallbackPayments = await this.loadFallbackVendorPayments(invoice);
    this.paymentRows.set(normalizePurchaseInvoicePaymentRows(invoice, fallbackPayments));
    this.resetAddPaymentRow(invoice);
  }

  private async loadFallbackVendorPayments(
    invoice: PurchaseInvoice,
  ): Promise<readonly VendorPayment[]> {
    const ids = (invoice.payments ?? [])
      .filter((link) => {
        const payment = link.vendorpayment;
        return (
          Boolean(payment?.id ?? link.vendorpaymentid) &&
          (!payment || !payment.date || !payment.number || (!payment.bcash && !payment.bcashid))
        );
      })
      .map((link) => link.vendorpayment?.id ?? link.vendorpaymentid)
      .filter((id): id is string => Boolean(id));

    if (!ids.length) return [];

    this.fallbackPaymentsLoading.set(true);
    try {
      return await this.vendorPaymentService.list({
        includes: ['bcash'],
        where: { id: { inq: Array.from(new Set(ids)) } },
      });
    } catch {
      return [];
    } finally {
      this.fallbackPaymentsLoading.set(false);
    }
  }

  private resetAddPaymentRow(invoice: PurchaseInvoice): void {
    const outstanding = calculatePurchaseInvoiceOutstanding(invoice);
    this.submitted.set(false);
    this.autoNumbering.set(true);
    this.number.set('Auto Number');
    this.paymentDate.set(this.readRememberedPaymentDate() ?? this.defaultPaymentDate());
    this.amount.set(
      outstanding > 0
        ? formatAmountForCurrency(
            outstanding,
            invoice.currencycode ?? invoice.currency?.code,
            invoice.currency,
          )
        : '',
    );
    this.description.set('');
    this.selectedBankCash.set(null);
    this.bankCashId.set('');
    this.bankCashQuery.set('');
  }

  private currentDraft(): PurchaseInvoicePaymentDraft {
    return {
      amount: this.amount(),
      autoNumbering: this.autoNumbering(),
      bankCashId: this.bankCashId(),
      date: this.paymentDate(),
      description: this.description(),
      number: this.number(),
    };
  }

  protected getPaymentDateError(): string | null {
    if (!this.paymentDate()) return null;
    return this.fiscalYearDateRange.errorMessage(this.paymentDate(), 'Payment date');
  }

  private defaultPaymentDate(): string {
    return this.fiscalYearDateRange.defaultDate() ?? dayjs().format(DEFAULT_NODE_DATE_FORMAT);
  }

  private rememberPaymentDate(): void {
    try {
      const rememberedDate = this.normalizeRememberedPaymentDate(this.paymentDate());
      if (!rememberedDate) return;

      localStorage.setItem(this.rememberedPaymentDateKey(), rememberedDate);
    } catch {
      // localStorage may be unavailable (private browsing, quota, etc.)
    }
  }

  private readRememberedPaymentDate(): string | null {
    try {
      return this.normalizeRememberedPaymentDate(
        localStorage.getItem(this.rememberedPaymentDateKey()),
      );
    } catch {
      return null;
    }
  }

  private normalizeRememberedPaymentDate(value: unknown): string | null {
    const isoDate = this.fiscalYearDateRange.toIsoDate(value);
    return isoDate ? this.fiscalYearDateRange.defaultDate(isoDate) : null;
  }

  private rememberedPaymentDateKey(): string {
    const session = this.userSession.session();
    const organizationId = session?.organization?.id ?? session?.branch?.organizationid;
    return [
      LAST_PAYMENT_DATE_KEY_PREFIX,
      this.storageKeyPart(session?.userid),
      this.storageKeyPart(organizationId),
      this.storageKeyPart(session?.branch?.id),
      this.storageKeyPart(session?.fiscalyear?.id),
    ].join(':');
  }

  private storageKeyPart(value: unknown): string {
    const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    return text ? encodeURIComponent(text) : 'global';
  }

  private withSelectedOption<T extends { id?: string }>(
    list: readonly T[],
    selected: T | null,
  ): T[] {
    const options = list.slice(0, 15);
    if (!selected?.id || options.some((option) => option.id === selected.id)) {
      return options;
    }

    return [selected, ...options.slice(0, 14)];
  }
}
