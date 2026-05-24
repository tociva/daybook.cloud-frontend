import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
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
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { CountryStore } from '../../../data/country/country.store';
import type { Country } from '../../../data/country/country.model';
import { CurrencyStore } from '../../../data/currency/currency.store';
import type { Currency } from '../../../data/currency/currency.model';
import { DateFormatStore } from '../../../data/date-format/date-format.store';
import type { DateFormat } from '../../../data/date-format/date-format.model';
import { OrganizationFacade, OrganizationStore } from '../../../data/organization';
import type { OrganizationBootstrap, OrganizationPayload } from '../../../data/organization';
import {
  toDateRangeEnd,
  toDateRangeStartFromFiscalStart,
} from '../../../../../../core/date/dayjs-date.utils';
import {
  DEFAULT_INVOICE_NUMBER_FORMAT,
  DEFAULT_JOURNAL_NUMBER_FORMAT,
  DEFAULT_RECEIPT_NUMBER_FORMAT,
} from '../../../../../../util/constants';

const getCurrentFiscalYearRange = (): Readonly<{ start: string; end: string }> => {
  const year = new Date().getFullYear();

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
};

const isDateInputValue = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value.trim());

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    FormField,
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
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.css', '../../../../../../../styles/flags.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganizationComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationFacade);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly countryStore = inject(CountryStore);
  protected readonly currencyStore = inject(CurrencyStore);
  protected readonly dateFormatStore = inject(DateFormatStore);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);

  // ── Form signals ──────────────────────────────────────────────────────────
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly mobile = signal('');
  protected readonly description = signal('');
  protected readonly state = signal('');
  protected readonly gstin = signal('');
  protected readonly addressLine1 = signal('');
  protected readonly addressLine2 = signal('');
  protected readonly addressCity = signal('');
  protected readonly addressPincode = signal('');
  protected readonly fiscalstart = signal('January-01');
  protected readonly fiscalname = signal(`${new Date().getFullYear()} Financial Year`);
  protected readonly fiscalYearStart = signal(getCurrentFiscalYearRange().start);
  protected readonly fiscalYearEnd = signal(getCurrentFiscalYearRange().end);
  protected readonly invnumber = signal(DEFAULT_INVOICE_NUMBER_FORMAT);
  protected readonly recnumber = signal(DEFAULT_RECEIPT_NUMBER_FORMAT);
  protected readonly jnumber = signal(DEFAULT_JOURNAL_NUMBER_FORMAT);

  // ── Default branch autocomplete ───────────────────────────────────────────
  protected readonly countries = this.countryStore.countries;
  protected readonly currencies = this.currencyStore.currencies;
  protected readonly dateFormats = this.dateFormatStore.dateFormats;
  protected readonly countryQuery = signal('');
  protected readonly currencyQuery = signal('');
  protected readonly dateFormatQuery = signal('');
  protected readonly countryCurrencyModel = signal({
    countrycode: '',
    currencycode: '',
    dateformat: '',
  });
  protected readonly countryCurrencyForm = form(this.countryCurrencyModel);

  protected readonly countryOptionValue = (country: Country): string => country.code;
  protected readonly countryOptionLabel = (country: Country): string => country.name;
  protected readonly countryTrackBy = (_index: number, country: Country): string => country.code;
  protected readonly getCountryFlagClass = (country: Country): string =>
    `country-flag country-flag--${country.code.toLowerCase()}`;
  protected readonly currencyOptionValue = (currency: Currency): string => currency.code;
  protected readonly currencyOptionLabel = (currency: Currency): string =>
    `${currency.name} (${currency.symbol})`;
  protected readonly currencyTrackBy = (_index: number, currency: Currency): string =>
    currency.code;
  protected readonly dateFormatOptionValue = (dateFormat: DateFormat): string => dateFormat.name;
  protected readonly dateFormatOptionLabel = (dateFormat: DateFormat): string =>
    `${dateFormat.name} (${dateFormat.example})`;
  protected readonly dateFormatTrackBy = (_index: number, dateFormat: DateFormat): string =>
    dateFormat.name;
  protected readonly filteredCountries = computed(() =>
    this.filterAutocompleteOptions(this.countries(), this.countryOptionLabel, this.countryQuery()),
  );
  protected readonly filteredCurrencies = computed(() =>
    this.filterAutocompleteOptions(
      this.currencies(),
      this.currencyOptionLabel,
      this.currencyQuery(),
    ),
  );
  protected readonly filteredDateFormats = computed(() =>
    this.filterAutocompleteOptions(
      this.dateFormats(),
      this.dateFormatOptionLabel,
      this.dateFormatQuery(),
    ),
  );

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Organization' : 'New Organization',
  );
  protected readonly description_ = computed(() =>
    this.mode() === 'edit'
      ? 'Update basic organization details.'
      : 'Fill in organization details and the default branch setup.',
  );

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.name().trim() === '' ? 'Name is required.' : null,
  );
  protected readonly emailError = computed(() => {
    if (!this.submitted()) return null;
    const v = this.email().trim();
    if (v === '') return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email address.';
    return null;
  });
  protected readonly addressLine1Error = computed(() =>
    this.submitted() && this.addressLine1().trim() === '' ? 'Address line 1 is required.' : null,
  );
  protected readonly countryError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.countryCurrencyModel().countrycode === ''
      ? 'Country is required.'
      : null,
  );
  protected readonly currencyError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.countryCurrencyModel().currencycode === ''
      ? 'Currency is required.'
      : null,
  );
  protected readonly dateFormatError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.countryCurrencyModel().dateformat === ''
      ? 'Date format is required.'
      : null,
  );
  protected readonly fiscalstartError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.fiscalstart().trim() === ''
      ? 'Fiscal start is required.'
      : null,
  );
  protected readonly fiscalnameError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.fiscalname().trim() === ''
      ? 'Fiscal name is required.'
      : null,
  );
  protected readonly fiscalYearStartError = computed(() => {
    if (!this.submitted() || this.mode() !== 'create') return null;
    if (this.fiscalYearStart().trim() === '') return 'Fiscal year start date is required.';
    return isDateInputValue(this.fiscalYearStart()) ? null : 'Use a valid start date.';
  });
  protected readonly fiscalYearEndError = computed(() => {
    if (!this.submitted() || this.mode() !== 'create') return null;
    if (this.fiscalYearEnd().trim() === '') return 'Fiscal year end date is required.';
    if (!isDateInputValue(this.fiscalYearEnd())) return 'Use a valid end date.';
    if (
      isDateInputValue(this.fiscalYearStart()) &&
      this.fiscalYearEnd() < this.fiscalYearStart()
    ) {
      return 'End date must be after start date.';
    }
    return null;
  });
  protected readonly invnumberError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.invnumber().trim() === ''
      ? 'Invoice number format is required.'
      : null,
  );
  protected readonly recnumberError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.recnumber().trim() === ''
      ? 'Receipt number format is required.'
      : null,
  );
  protected readonly jnumberError = computed(() =>
    this.submitted() && this.mode() === 'create' && this.jnumber().trim() === ''
      ? 'Journal number format is required.'
      : null,
  );
  protected readonly hasErrors = computed(
    () =>
      this.nameError() !== null ||
      this.emailError() !== null ||
      this.addressLine1Error() !== null ||
      this.countryError() !== null ||
      this.currencyError() !== null ||
      this.dateFormatError() !== null ||
      this.fiscalstartError() !== null ||
      this.fiscalnameError() !== null ||
      this.fiscalYearStartError() !== null ||
      this.fiscalYearEndError() !== null ||
      this.invnumberError() !== null ||
      this.recnumberError() !== null ||
      this.jnumberError() !== null,
  );

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
    void this.dateFormatStore.load();
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    this.organizationStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      const org = await this.organizationStore.loadOrganizationById(id);
      if (org) {
        this.name.set(org.name ?? '');
        this.email.set(org.email ?? '');
        this.mobile.set(org.mobile ?? '');
        this.description.set(org.description ?? '');
        this.addressLine1.set((org.address as { line1?: string } | undefined)?.line1 ?? '');
        this.addressLine2.set((org.address as { line2?: string } | undefined)?.line2 ?? '');
        this.addressCity.set((org.address as { city?: string } | undefined)?.city ?? '');
        this.addressPincode.set((org.address as { pincode?: string } | undefined)?.pincode ?? '');
      }
    }
  }

  // ── Country/Currency autocomplete handlers ────────────────────────────────
  protected selectCountry(value: unknown): void {
    const countryCode = typeof value === 'string' ? value : '';
    if (!countryCode.trim()) {
      return;
    }

    const country = this.countries().find((item) => item.code === countryCode) ?? null;
    this.countryCurrencyModel.update((current) => ({
      ...current,
      countrycode: countryCode,
      currencycode: country?.currencycode ?? current.currencycode,
      dateformat: country?.dateformat ?? current.dateformat,
    }));

    if (!this.mobile() || this.mobile() === '') {
      this.mobile.set(country ? `+${country.phone}-` : '');
    }

    if (country?.fiscalstart) {
      this.fiscalstart.set(country.fiscalstart);
      const start = toDateRangeStartFromFiscalStart(country.fiscalstart, this.fiscalYearStart());
      this.fiscalYearStart.set(start);
      this.fiscalYearEnd.set(toDateRangeEnd(start, this.fiscalYearEnd()));
    }
  }

  protected selectCurrency(value: unknown): void {
    const currencyCode = typeof value === 'string' ? value : '';
    if (!currencyCode.trim()) {
      return;
    }

    this.countryCurrencyModel.update((current) => ({
      ...current,
      currencycode: currencyCode,
    }));
  }

  protected selectDateFormat(value: unknown): void {
    const dateFormatName = typeof value === 'string' ? value : '';
    if (!dateFormatName.trim()) {
      return;
    }

    this.countryCurrencyModel.update((current) => ({
      ...current,
      dateformat: dateFormatName,
    }));
  }

  protected onFiscalStartInput(event: Event): void {
    const fiscalStart = (event.target as HTMLInputElement).value;
    this.fiscalstart.set(fiscalStart);

    const start = toDateRangeStartFromFiscalStart(fiscalStart, this.fiscalYearStart());
    this.fiscalYearStart.set(start);
    this.fiscalYearEnd.set(toDateRangeEnd(start, this.fiscalYearEnd()));
  }

  protected onFiscalYearStartInput(event: Event): void {
    const start = (event.target as HTMLInputElement).value;
    this.fiscalYearStart.set(start);
    this.fiscalYearEnd.set(toDateRangeEnd(start, this.fiscalYearEnd()));
  }

  protected onCountryQueryChange(event: unknown): void {
    this.countryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onCurrencyQueryChange(event: unknown): void {
    this.currencyQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onDateFormatQueryChange(event: unknown): void {
    this.dateFormatQuery.set(this.normalizeAutocompleteQuery(event));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    if (this.hasErrors()) return;

    this.isSubmitting.set(true);

    try {
      const id = this.id();
      if (id) {
        await this.facade.update(id, this.buildOrganizationPayload());
      } else {
        await this.facade.createWithDefaultBranch(this.buildBootstrapPayload());
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private buildOrganizationPayload(): OrganizationPayload {
    return {
      name: this.name().trim(),
      email: this.email().trim(),
      ...(this.mobile().trim() && { mobile: this.mobile().trim() }),
      ...(this.description().trim() && { description: this.description().trim() }),
      address: this.buildAddressPayload(),
    };
  }

  private buildBootstrapPayload(): OrganizationBootstrap {
    const defaultBranch = this.countryCurrencyModel();

    return {
      ...this.buildOrganizationPayload(),
      address: this.buildAddressPayload(),
      countrycode: defaultBranch.countrycode,
      currencycode: defaultBranch.currencycode,
      dateformat: defaultBranch.dateformat,
      fiscalstart: this.fiscalstart().trim(),
      fiscalname: this.fiscalname().trim(),
      startdate: this.fiscalYearStart().trim(),
      enddate: this.fiscalYearEnd().trim(),
      invnumber: this.invnumber().trim(),
      recnumber: this.recnumber().trim(),
      jnumber: this.jnumber().trim(),
      ...(this.state().trim() && { state: this.state().trim() }),
      ...(this.gstin().trim() && { gstin: this.gstin().trim() }),
    };
  }

  private buildAddressPayload(): NonNullable<OrganizationPayload['address']> {
    return {
      line1: this.addressLine1().trim(),
      ...(this.addressLine2().trim() && { line2: this.addressLine2().trim() }),
      ...(this.addressCity().trim() && { city: this.addressCity().trim() }),
      ...(this.addressPincode().trim() && { pincode: this.addressPincode().trim() }),
    };
  }

  private normalizeAutocompleteQuery(event: unknown): string {
    return typeof event === 'string' ? event.trim().toLowerCase() : '';
  }

  private filterAutocompleteOptions<T>(
    options: readonly T[],
    getLabel: (option: T) => string,
    query: string,
  ): T[] {
    if (!query) {
      return [...options];
    }

    return options.filter((option) => getLabel(option).toLowerCase().includes(query));
  }
}
