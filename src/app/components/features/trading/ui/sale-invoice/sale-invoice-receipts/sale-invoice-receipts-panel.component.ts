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
import { getApiErrorMessage } from '../../../../../../core/api/api-error.util';
import { DateManagementService } from '../../../../../../core/date/date-management.service';
import { formatAmountWithCurrency } from '../../../../../../shared/format/currency';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashStore } from '../../../data/bank-cash';
import { CustomerReceiptFacade, CustomerReceiptService } from '../../../data/customer-receipt';
import type { CustomerReceipt } from '../../../data/customer-receipt';
import type { SaleInvoice } from '../../../data/sale-invoice';
import { SaleInvoiceService } from '../../../data/sale-invoice';
import {
  buildSaleInvoiceReceiptPayload,
  calculateSaleInvoiceOutstanding,
  calculateSaleInvoiceReceivedTotal,
  getSaleInvoiceReceiptDraftError,
  normalizeSaleInvoiceReceiptRows,
  type SaleInvoiceReceiptDraft,
  type SaleInvoiceReceiptRow,
} from './sale-invoice-receipts.util';

const SALE_INVOICE_RECEIPTS_INCLUDES = [
  'customer',
  'currency',
  {
    relation: 'receipts',
    scope: {
      include: [
        {
          relation: 'customerreceipt',
          scope: { include: [{ relation: 'bcash' }] },
        },
      ],
    },
  },
] as const satisfies readonly Lb4Include[];

const LAST_RECEIPT_DATE_KEY_PREFIX = 'daybook:sale-invoice-receipt:last-date';

@Component({
  selector: 'app-sale-invoice-receipts-panel',
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
  templateUrl: './sale-invoice-receipts-panel.component.html',
  styleUrl: './sale-invoice-receipts-panel.component.css',
})
export class SaleInvoiceReceiptsPanelComponent {
  readonly invoiceId = input.required<string>();

  private readonly router = inject(Router);
  private readonly dateManagement = inject(DateManagementService);
  private readonly customerReceiptFacade = inject(CustomerReceiptFacade);
  private readonly customerReceiptService = inject(CustomerReceiptService);
  private readonly saleInvoiceService = inject(SaleInvoiceService);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly userSession = inject(UserSessionStore);

  protected readonly bankCashStore = inject(BankCashStore);

  protected readonly invoice = signal<SaleInvoice | null>(null);
  protected readonly invoiceError = signal<string | null>(null);
  protected readonly invoiceLoading = signal(false);
  protected readonly receiptRows = signal<readonly SaleInvoiceReceiptRow[]>([]);
  protected readonly fallbackReceiptsLoading = signal(false);
  protected readonly savingReceipt = signal(false);
  protected readonly submitted = signal(false);

  protected readonly autoNumbering = signal(true);
  protected readonly number = signal('Auto Number');
  protected readonly receiptDate = signal('');
  protected readonly amount = signal('');
  protected readonly description = signal('');
  protected readonly selectedBankCash = signal<BankCash | null>(null);
  protected readonly bankCashId = signal('');
  protected readonly bankCashQuery = signal('');

  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly receivedTotal = computed(() =>
    calculateSaleInvoiceReceivedTotal(this.invoice()),
  );
  protected readonly outstandingBalance = computed(() =>
    calculateSaleInvoiceOutstanding(this.invoice()),
  );
  protected readonly canAddReceipt = computed(
    () => Boolean(this.invoice()?.id) && this.outstandingBalance() > 0,
  );
  protected readonly filteredBankCashes = computed<BankCash[]>(() =>
    this.withSelectedOption(
      this.bankCashStore.items() as readonly BankCash[],
      this.selectedBankCash(),
    ),
  );
  protected readonly addReceiptError = computed(() => {
    if (!this.submitted()) return null;
    const invoice = this.invoice();
    const dateError = this.getReceiptDateError();

    return getSaleInvoiceReceiptDraftError(invoice, this.currentDraft(), { dateError });
  });

  protected readonly formatAmountWithCurrency = formatAmountWithCurrency;

  protected readonly bankCashOptionValue = (bankCash: BankCash): string => bankCash.id ?? '';
  protected readonly bankCashOptionLabel = (bankCash: BankCash): string => bankCash.name ?? '';
  protected readonly bankCashTrackBy = (_index: number, bankCash: BankCash): string =>
    bankCash.id ?? bankCash.name;

  constructor() {
    this.receiptDate.set(this.defaultReceiptDate());
    void this.bankCashStore.loadBankCashes({});

    effect(() => {
      const id = this.invoiceId();
      if (!id) {
        this.receiptRows.set([]);
        return;
      }

      void untracked(() => this.loadInitialState(id));
    });
  }

  protected formatDate(value: string | undefined): string {
    return this.dateManagement.formatDisplayDate(value, '—');
  }

  protected rowReceiptNumber(row: SaleInvoiceReceiptRow): string {
    return row.number || row.receiptId || '—';
  }

  protected rowBankCashName(row: SaleInvoiceReceiptRow): string {
    return row.bankCash?.name || row.bankCashId || '—';
  }

  protected viewReceipt(row: SaleInvoiceReceiptRow): void {
    if (!row.receiptId) return;

    void this.router.navigate(['/app/trading/customer-receipt', row.receiptId, 'edit'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onReceiptDateChange(value: unknown): void {
    if (typeof value === 'string') {
      this.receiptDate.set(value);
      return;
    }
    if (dayjs.isDayjs(value) && value.isValid()) {
      this.receiptDate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
      return;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      this.receiptDate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
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

  protected async saveReceipt(): Promise<void> {
    this.submitted.set(true);
    if (this.addReceiptError() || this.savingReceipt()) return;

    const invoice = this.invoice();
    if (!invoice) return;

    const payload = buildSaleInvoiceReceiptPayload(invoice, this.currentDraft(), {
      dateError: this.getReceiptDateError(),
    });

    this.savingReceipt.set(true);
    try {
      const created = await this.customerReceiptFacade.create(payload, { navigateBack: false });
      if (created && invoice.id) {
        this.rememberReceiptDate();
        await this.loadInvoiceReceipts(invoice.id);
      }
    } finally {
      this.savingReceipt.set(false);
    }
  }

  private async loadInitialState(id: string): Promise<void> {
    await this.loadInvoiceReceipts(id);
  }

  private async loadInvoiceReceipts(id: string): Promise<void> {
    this.invoiceLoading.set(true);
    this.invoiceError.set(null);

    try {
      const invoice = await this.saleInvoiceService.getById(id, {
        includes: SALE_INVOICE_RECEIPTS_INCLUDES,
      });
      const fallbackReceipts = await this.loadFallbackCustomerReceipts(invoice);

      this.invoice.set(invoice);
      this.receiptRows.set(normalizeSaleInvoiceReceiptRows(invoice, fallbackReceipts));
      this.resetAddReceiptRow(invoice);
    } catch (error) {
      this.invoice.set(null);
      this.receiptRows.set([]);
      this.invoiceError.set(getApiErrorMessage(error, 'Failed to load sale invoice receipts.'));
    } finally {
      this.invoiceLoading.set(false);
    }
  }

  private async loadFallbackCustomerReceipts(
    invoice: SaleInvoice,
  ): Promise<readonly CustomerReceipt[]> {
    const ids = (invoice.receipts ?? [])
      .filter((link) => {
        const receipt = link.customerreceipt;
        return (
          Boolean(receipt?.id ?? link.customerreceiptid) &&
          (!receipt || !receipt.date || !receipt.number || (!receipt.bcash && !receipt.bcashid))
        );
      })
      .map((link) => link.customerreceipt?.id ?? link.customerreceiptid)
      .filter((id): id is string => Boolean(id));

    if (!ids.length) return [];

    this.fallbackReceiptsLoading.set(true);
    try {
      return await this.customerReceiptService.list({
        includes: ['bcash'],
        where: { id: { inq: Array.from(new Set(ids)) } },
      });
    } catch {
      return [];
    } finally {
      this.fallbackReceiptsLoading.set(false);
    }
  }

  private resetAddReceiptRow(invoice: SaleInvoice): void {
    const outstanding = calculateSaleInvoiceOutstanding(invoice);
    this.submitted.set(false);
    this.autoNumbering.set(true);
    this.number.set('Auto Number');
    this.receiptDate.set(this.readRememberedReceiptDate() ?? this.defaultReceiptDate());
    this.amount.set(outstanding > 0 ? outstanding.toFixed(2) : '');
    this.description.set('');
    this.selectedBankCash.set(null);
    this.bankCashId.set('');
    this.bankCashQuery.set('');
  }

  private currentDraft(): SaleInvoiceReceiptDraft {
    return {
      amount: this.amount(),
      autoNumbering: this.autoNumbering(),
      bankCashId: this.bankCashId(),
      date: this.receiptDate(),
      description: this.description(),
      number: this.number(),
    };
  }

  protected getReceiptDateError(): string | null {
    if (!this.receiptDate()) return null;
    return this.fiscalYearDateRange.errorMessage(this.receiptDate(), 'Receipt date');
  }

  private defaultReceiptDate(): string {
    return this.fiscalYearDateRange.defaultDate() ?? dayjs().format(DEFAULT_NODE_DATE_FORMAT);
  }

  private rememberReceiptDate(): void {
    try {
      const rememberedDate = this.normalizeRememberedReceiptDate(this.receiptDate());
      if (!rememberedDate) return;

      localStorage.setItem(this.rememberedReceiptDateKey(), rememberedDate);
    } catch {
      // localStorage may be unavailable (private browsing, quota, etc.)
    }
  }

  private readRememberedReceiptDate(): string | null {
    try {
      return this.normalizeRememberedReceiptDate(
        localStorage.getItem(this.rememberedReceiptDateKey()),
      );
    } catch {
      return null;
    }
  }

  private normalizeRememberedReceiptDate(value: unknown): string | null {
    const isoDate = this.fiscalYearDateRange.toIsoDate(value);
    return isoDate ? this.fiscalYearDateRange.defaultDate(isoDate) : null;
  }

  private rememberedReceiptDateKey(): string {
    const session = this.userSession.session();
    const organizationId = session?.organization?.id ?? session?.branch?.organizationid;
    return [
      LAST_RECEIPT_DATE_KEY_PREFIX,
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
