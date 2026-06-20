import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  TngTextareaComponent,
} from '@tailng-ui/components';
import dayjs from 'dayjs';
import type { Currency } from '../../../../management/data/currency/currency.model';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { FiscalYearDatepickerComponent } from '../../../../../../shared/fiscal-year-datepicker';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';
import type { BankCash } from '../../../data/bank-cash';
import { BankCashStore } from '../../../data/bank-cash';
import type { ContraTransaction, ContraTransactionPayload } from '../../../data/contra-transaction';
import { ContraTransactionFacade, ContraTransactionStore } from '../../../data/contra-transaction';

@Component({
  selector: 'app-create-bank-contra',
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
    TngLabelComponent,
    TngTextareaComponent,
    FiscalYearDatepickerComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-bank-contra.component.html',
  styleUrl: './create-bank-contra.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBankContraComponent {
  private static readonly LAST_DATE_KEY_PREFIX = 'daybook:bank-contra:last-date';

  private readonly facade = inject(ContraTransactionFacade);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private readonly navigation = inject(BurlNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly userSessionStore = inject(UserSessionStore);
  protected readonly bankCashStore = inject(BankCashStore);
  protected readonly contraTransactionStore = inject(ContraTransactionStore);
  protected readonly currencyStore = inject(CurrencyStore);

  private bankCashSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Bank Contra' : 'New Bank Contra',
  );
  protected readonly submitted = signal(false);

  protected readonly date = signal(this.fiscalYearDateRange.defaultDate());
  protected readonly amount = signal('');
  protected readonly currencycode = signal('');
  protected readonly description = signal('');

  protected readonly selectedFromBankCash = signal<BankCash | null>(null);
  protected readonly selectedToBankCash = signal<BankCash | null>(null);
  protected readonly frombcashid = signal('');
  protected readonly tobcashid = signal('');

  protected readonly currencyQuery = signal('');
  protected readonly filteredCurrencies = computed<Currency[]>(() =>
    this.filterCurrencies(this.currencyStore.currencies(), this.currencyQuery()),
  );
  protected readonly currencyOptionValue = (currency: Currency): string => currency.code;
  protected readonly currencyOptionLabel = (currency: Currency): string =>
    `${currency.name} (${currency.symbol})`;
  protected readonly currencyTrackBy = (_index: number, currency: Currency): string =>
    currency.code;

  protected readonly bankCashOptions = computed<BankCash[]>(() =>
    this.withSelectedBankCashOptions(this.bankCashStore.items() as BankCash[]),
  );
  protected readonly bankCashOptionValue = (bankCash: BankCash): string => bankCash.id ?? '';
  protected readonly bankCashOptionLabel = (bankCash: BankCash): string => bankCash.name;
  protected readonly bankCashTrackBy = (_index: number, bankCash: BankCash): string =>
    bankCash.id ?? bankCash.name;

  protected readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.date()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.date(), 'Contra date');
  });
  protected readonly amountError = computed(() => {
    if (!this.submitted()) return null;
    const value = Number(this.amount());
    if (!this.amount()) return 'Amount is required.';
    return Number.isFinite(value) && value > 0 ? null : 'Amount must be greater than 0.';
  });
  protected readonly currencyError = computed(() =>
    this.submitted() && !this.currencycode().trim() ? 'Currency is required.' : null,
  );
  protected readonly fromBankCashError = computed(() =>
    this.submitted() && !this.frombcashid() ? 'From account is required.' : null,
  );
  protected readonly toBankCashError = computed(() =>
    this.submitted() && !this.tobcashid() ? 'To account is required.' : null,
  );
  protected readonly sameBankCashError = computed(() =>
    this.submitted() && this.frombcashid() && this.frombcashid() === this.tobcashid()
      ? 'From and to accounts must be different.'
      : null,
  );

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.contraTransactionStore.clearError();

    await Promise.all([
      this.bankCashStore.loadBankCashes({ limit: 1000, offset: 0 }),
      this.currencyStore.load(),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.contraTransactionStore.clearSelectedItem();
      this.currencycode.set(this.defaultCurrencyCode());
      this.applyRememberedContraDate();
      await this.applyQueryPrefill();
      return;
    }

    const cached = this.contraTransactionStore.selectedItem();
    if (cached?.id === id) {
      await this.patchFromContra(cached);
      return;
    }

    const contra = await this.contraTransactionStore.loadContraTransactionById(id, {
      includes: ['frombcash', 'tobcash'],
    });
    if (contra) {
      await this.patchFromContra(contra);
    }
  }

  private async patchFromContra(contra: ContraTransaction): Promise<void> {
    const contraDate = this.fiscalYearDateRange.toIsoDate(contra.date);
    this.date.set(contraDate ?? this.fiscalYearDateRange.defaultDate());
    this.amount.set(String(contra.amount ?? ''));
    this.currencycode.set(contra.currencycode ?? this.defaultCurrencyCode());
    this.description.set(contra.description ?? '');

    const fromId = contra.frombcashid ?? contra.frombcash?.id ?? '';
    const fromBankCash = await this.resolveBankCash(contra.frombcash, fromId);
    this.selectedFromBankCash.set(fromBankCash);
    this.frombcashid.set(fromBankCash?.id ?? fromId);

    const toId = contra.tobcashid ?? contra.tobcash?.id ?? '';
    const toBankCash = await this.resolveBankCash(contra.tobcash, toId);
    this.selectedToBankCash.set(toBankCash);
    this.tobcashid.set(toBankCash?.id ?? toId);
  }

  private async applyQueryPrefill(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const date = this.normalizeContraDate(params.get('date'));
    if (date) {
      this.date.set(date);
    }

    const amount = this.normalizePositiveAmount(params.get('amount'));
    if (amount) {
      this.amount.set(amount);
    }

    const description = params.get('description')?.trim();
    if (description) {
      this.description.set(description);
    }

    await Promise.all([
      this.applyPrefillBankCash('from', params.get('frombcashid')),
      this.applyPrefillBankCash('to', params.get('tobcashid')),
    ]);
  }

  private async applyPrefillBankCash(
    side: 'from' | 'to',
    value: string | null,
  ): Promise<void> {
    const id = value?.trim();
    if (!id) return;

    const bankCash = await this.resolveBankCash(undefined, id);
    if (side === 'from') {
      this.selectedFromBankCash.set(bankCash);
      this.frombcashid.set(bankCash?.id ?? id);
      return;
    }

    this.selectedToBankCash.set(bankCash);
    this.tobcashid.set(bankCash?.id ?? id);
  }

  private normalizePositiveAmount(value: string | null): string | null {
    const trimmed = value?.trim();
    if (!trimmed) return null;

    const amount = Number(trimmed);
    return Number.isFinite(amount) && amount > 0 ? trimmed : null;
  }

  protected onDateChange(value: unknown): void {
    if (typeof value === 'string') {
      this.date.set(value);
    } else if (dayjs.isDayjs(value) && value.isValid()) {
      this.date.set(value.format(DEFAULT_NODE_DATE_FORMAT));
    } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
      this.date.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
    }
  }

  protected onCurrencyQueryChange(event: unknown): void {
    this.currencyQuery.set(typeof event === 'string' ? event.trim().toLowerCase() : '');
  }

  protected onCurrencyValueChange(value: unknown): void {
    const code = typeof value === 'string' ? value : '';
    this.currencycode.set(code);
  }

  protected onBankCashQueryChange(event: unknown): void {
    const query = typeof event === 'string' ? event.trim() : '';
    if (this.bankCashSearchTimer) clearTimeout(this.bankCashSearchTimer);
    this.bankCashSearchTimer = setTimeout(() => {
      void this.bankCashStore.loadBankCashes(
        query
          ? { limit: 50, offset: 0, where: { name: { ilike: `%${query}%` } } }
          : { limit: 1000, offset: 0 },
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected onFromBankCashValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    const bankCash = this.bankCashOptions().find((item) => item.id === id) ?? null;
    this.selectedFromBankCash.set(bankCash);
    this.frombcashid.set(id);
  }

  protected onToBankCashValueChange(value: unknown): void {
    const id = typeof value === 'string' ? value : '';
    const bankCash = this.bankCashOptions().find((item) => item.id === id) ?? null;
    this.selectedToBankCash.set(bankCash);
    this.tobcashid.set(id);
  }

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    const amountValue = Number(this.amount());
    if (
      this.dateError() ||
      this.amountError() ||
      this.currencyError() ||
      this.fromBankCashError() ||
      this.toBankCashError() ||
      this.sameBankCashError()
    ) {
      return;
    }

    const payload: ContraTransactionPayload = {
      date: this.date(),
      amount: amountValue,
      currencycode: this.currencycode().trim(),
      frombcashid: this.frombcashid(),
      tobcashid: this.tobcashid(),
      ...(this.description().trim() ? { description: this.description().trim() } : {}),
    };

    const id = this.id();
    const saved = id
      ? await this.facade.update(id, payload, { navigateBack: false })
      : !!(await this.facade.create(payload, { navigateBack: false }));

    if (!saved) return;
    this.rememberContraDate();
    await this.navigation.navigateBack();
  }

  private filterCurrencies(currencies: readonly Currency[], query: string): Currency[] {
    if (!query) return [...currencies];
    return currencies.filter((currency) =>
      this.currencyOptionLabel(currency).toLowerCase().includes(query),
    );
  }

  private withSelectedBankCashOptions(items: readonly BankCash[]): BankCash[] {
    const options = items.slice(0, 25);
    for (const selected of [this.selectedFromBankCash(), this.selectedToBankCash()]) {
      if (selected?.id && !options.some((option) => option.id === selected.id)) {
        options.unshift(selected);
      }
    }

    return options.slice(0, 25);
  }

  private async resolveBankCash(
    candidate: BankCash | undefined,
    id: string,
  ): Promise<BankCash | null> {
    if (candidate?.name) return candidate;

    const cached = (this.bankCashStore.items() as BankCash[]).find((item) => item.id === id);
    if (cached) return cached;
    if (!id) return null;

    return this.bankCashStore.loadBankCashById(id);
  }

  private defaultCurrencyCode(): string {
    return (
      this.userSessionStore.session()?.branch?.currencycode ??
      this.userSessionStore.session()?.fiscalyear?.currencycode ??
      'INR'
    );
  }

  private applyRememberedContraDate(): void {
    try {
      const raw = localStorage.getItem(this.rememberedContraDateKey());
      const rememberedDate = this.normalizeContraDate(raw);
      if (!rememberedDate) return;

      this.date.set(rememberedDate);
    } catch {
      // localStorage may be unavailable (private browsing, quota, etc.)
    }
  }

  private rememberContraDate(): void {
    try {
      const rememberedDate = this.normalizeContraDate(this.date());
      if (!rememberedDate) return;

      localStorage.setItem(this.rememberedContraDateKey(), rememberedDate);
    } catch {
      // localStorage may be unavailable (private browsing, quota, etc.)
    }
  }

  private normalizeContraDate(value: unknown): string | null {
    const isoDate = this.fiscalYearDateRange.toIsoDate(value);
    return isoDate ? this.fiscalYearDateRange.defaultDate(isoDate) : null;
  }

  private rememberedContraDateKey(): string {
    return this.scopedStorageKeyParts(CreateBankContraComponent.LAST_DATE_KEY_PREFIX).join(':');
  }

  private scopedStorageKeyParts(prefix: string): string[] {
    const session = this.userSessionStore.session();
    const organizationId = session?.organization?.id ?? session?.branch?.organizationid;
    return [
      prefix,
      this.storageKeyPart(session?.userid),
      this.storageKeyPart(organizationId),
      this.storageKeyPart(session?.branch?.id),
      this.storageKeyPart(session?.fiscalyear?.id),
    ];
  }

  private storageKeyPart(value: unknown): string {
    const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
    return text ? encodeURIComponent(text) : 'global';
  }
}
