import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngDatepickerComponent,
  TngDialogComponent,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngInput, TngInputGroup, TngSuffix } from '@tailng-ui/primitives';
import { TngIcon } from '@tailng-ui/icons';
import dayjs from 'dayjs';
import { Country } from '../../data/country/country.model';
import { CountryStore } from '../../data/country/country.store';
import { Currency } from '../../data/currency/currency.model';
import { CurrencyStore } from '../../data/currency/currency.store';
import { AppConfigStore } from '../../../../../core/config/app-config.store';
import {
  formatDisplayDate,
  toDateRangeEnd,
  toDateRangeStartFromFiscalStart,
  toIsoDate,
} from '../../../../../core/date/dayjs-date.utils';
import { DateFormat } from '../../data/date-format/date-format.model';
import { DateFormatStore } from '../../data/date-format/date-format.store';
import {
  BootstrapOrganizationStore,
  BootstrapOrganizationPayload,
} from '../../data/organization/bootstrap-organization.store';
import { ToastStore } from '../../../../../core/toast/toast.store';
import { UserSessionService } from '../../data/user-session/user-session.service';
import { UserSessionStore } from '../../data/user-session/user-session.store';
import { AutoNumberingTemplateGeneratorComponent } from '../../../../../shared/auto-numbering-template-generator/auto-numbering-template-generator.component';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../util/constants';

const DEFAULT_INVOICE_NUMBER_FORMAT = '<<YYYY>>/<<SERIAL3>>';
const DEFAULT_JOURNAL_NUMBER_FORMAT =
  '<<FISCAL_START_YY>>-<<FISCAL_END_YY>>/<<SERIAL1>>';

type OrgValidationFieldKey =
  | 'name'
  | 'email'
  | 'mobile'
  | 'state'
  | 'description'
  | 'gstin'
  | 'fiscalname'
  | 'invnumber'
  | 'jnumber'
  | 'address.line1'
  | 'address.line2'
  | 'address.city'
  | 'address.pincode'
  | 'country'
  | 'currency'
  | 'dateformatForm'
  | 'fiscalDateRange.start'
  | 'fiscalDateRange.end';

type OrganizationSignalFormModel = {
  address: {
    city: string;
    line1: string;
    line2: string;
    pincode: string;
  };
  countryCode: string;
  currencyCode: string;
  dateFormatName: string;
  description: string;
  email: string;
  fiscalDateRange: {
    start: string;
    end: string;
  };
  fiscalname: string;
  fiscalstart: string;
  gstin: string;
  invnumber: string;
  jnumber: string;
  mobile: string;
  name: string;
  state: string;
};

type OrganizationFormPayload = Readonly<{
  address: Readonly<{
    city: string;
    line1: string;
    line2: string;
    pincode: string;
  }>;
  country: Country | null;
  currency: Currency | null;
  dateformatForm: DateFormat | null;
  description: string;
  email: string;
  fiscaldaterange: readonly [string, string];
  fiscalname: string;
  fiscalstart: string;
  gstin: string;
  invnumber: string;
  jnumber: string;
  mobile: string;
  name: string;
  state: string;
}>;

const willPassRequiredStringValidation = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const willPassEmailValidation = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const willPassRequiredDateValidation = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'isValid' in value &&
    typeof (value as { isValid: unknown }).isValid === 'function'
  ) {
    return Boolean((value as { isValid: () => boolean }).isValid());
  }

  return false;
};

const getCurrentFiscalDateRange = (): { start: string; end: string } => {
  const year = new Date().getFullYear();

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
};

const createInitialForm = (): OrganizationSignalFormModel => ({
  address: {
    city: '',
    line1: '',
    line2: '',
    pincode: '',
  },
  countryCode: '',
  currencyCode: '',
  dateFormatName: '',
  description: '',
  email: '',
  fiscalDateRange: getCurrentFiscalDateRange(),
  fiscalname: `${new Date().getFullYear()} Financial Year`,
  fiscalstart: 'January-01',
  gstin: '',
  invnumber: DEFAULT_INVOICE_NUMBER_FORMAT,
  jnumber: DEFAULT_JOURNAL_NUMBER_FORMAT,
  mobile: '',
  name: '',
  state: '',
});

@Component({
  selector: 'app-bootstrap-organization',
  imports: [
    FormField,
    TngAutocompleteComponent,
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    TngDialogComponent,
    TngInputComponent,
    TngInput,
    TngInputGroup,
    TngLabelComponent,
    TngSuffix,
    TngStepperComponent,
    TngIcon,
    TngTextareaComponent,
    AutoNumberingTemplateGeneratorComponent,
  ],
  templateUrl: './bootstrap-organization.component.html',
  styleUrls: ['./bootstrap-organization.component.css', '../../../../../../styles/flags.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapOrganizationComponent {
  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly dateFormatStore = inject(DateFormatStore);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly bootstrapOrganizationStore = inject(BootstrapOrganizationStore);
  private readonly userSessionService = inject(UserSessionService);
  private readonly userSessionStore = inject(UserSessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly router = inject(Router);
  protected readonly countries = this.countryStore.countries;
  protected readonly currencies = this.currencyStore.currencies;
  protected readonly dateFormats = this.dateFormatStore.dateFormats;
  protected readonly countryQuery = signal('');
  protected readonly currencyQuery = signal('');
  protected readonly dateFormatQuery = signal('');

  protected readonly organizationModel = signal<OrganizationSignalFormModel>(createInitialForm());
  protected readonly organizationForm = form(this.organizationModel);

  protected readonly submitted = signal(false);
  protected readonly saved = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly invoiceTemplateDialogOpen = signal(false);
  protected readonly journalTemplateDialogOpen = signal(false);
  protected readonly touched = signal<Partial<Record<OrgValidationFieldKey, true>>>({});

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
    this.filterAutocompleteOptions(this.currencies(), this.currencyOptionLabel, this.currencyQuery()),
  );
  protected readonly filteredDateFormats = computed(() =>
    this.filterAutocompleteOptions(
      this.dateFormats(),
      this.dateFormatOptionLabel,
      this.dateFormatQuery(),
    ),
  );

  protected readonly selectedCountry = computed(() => {
    const countryCode = this.organizationModel().countryCode;

    return this.countries().find((country) => country.code === countryCode) ?? null;
  });

  protected readonly selectedCurrency = computed(() => {
    const currencyCode = this.organizationModel().currencyCode;

    return this.currencies().find((currency) => currency.code === currencyCode) ?? null;
  });

  protected readonly selectedDateFormat = computed(() => {
    const dateFormatName = this.organizationModel().dateFormatName;

    return this.dateFormats().find((dateFormat) => dateFormat.name === dateFormatName) ?? null;
  });

  protected readonly formValue = computed<OrganizationFormPayload>(() => {
    const model = this.organizationModel();

    return {
      address: {
        city: model.address.city,
        line1: model.address.line1,
        line2: model.address.line2,
        pincode: model.address.pincode,
      },
      country: this.selectedCountry(),
      currency: this.selectedCurrency(),
      dateformatForm: this.selectedDateFormat(),
      description: model.description,
      email: model.email,
      fiscaldaterange: [model.fiscalDateRange.start, model.fiscalDateRange.end],
      fiscalname: model.fiscalname,
      fiscalstart: model.fiscalstart,
      gstin: model.gstin,
      invnumber: model.invnumber,
      jnumber: model.jnumber,
      mobile: model.mobile,
      name: model.name,
      state: model.state,
    };
  });

  protected readonly validationErrors = computed(() => {
    const model = this.organizationModel();
    const errors: Partial<Record<OrgValidationFieldKey, string>> = {};

    if (!willPassRequiredStringValidation(model.name)) {
      errors.name = 'Name is required';
    }

    if (!willPassRequiredStringValidation(model.email)) {
      errors.email = 'Email is required';
    } else if (!willPassEmailValidation(model.email)) {
      errors.email = 'Invalid email address';
    }

    if (!willPassRequiredStringValidation(model.countryCode)) {
      errors.country = 'Country is required';
    }

    if (!willPassRequiredStringValidation(model.address.line1)) {
      errors['address.line1'] = 'Address Line 1 is required';
    }

    if (!willPassRequiredStringValidation(model.fiscalname)) {
      errors.fiscalname = 'Fiscal Name is required';
    }

    if (!willPassRequiredDateValidation(model.fiscalDateRange.start)) {
      errors['fiscalDateRange.start'] = 'Start Date is required';
    }

    if (!willPassRequiredDateValidation(model.fiscalDateRange.end)) {
      errors['fiscalDateRange.end'] = 'End Date is required';
    }

    if (!willPassRequiredStringValidation(model.invnumber)) {
      errors.invnumber = 'Invoice No. is required';
    }

    if (!willPassRequiredStringValidation(model.jnumber)) {
      errors.jnumber = 'Journal No. is required';
    }

    if (!willPassRequiredStringValidation(model.currencyCode)) {
      errors.currency = 'Currency is required';
    }

    if (!willPassRequiredStringValidation(model.dateFormatName)) {
      errors.dateformatForm = 'Date Format is required';
    }

    return errors;
  });

  protected readonly saveMessage = computed(() =>
    this.saved()
      ? `Organization "${this.organizationModel().name.trim()}" is ready to be created.`
      : null,
  );
  protected readonly setupSteps = computed(() => {
    const model = this.organizationModel();
    const basicCompleted =
      willPassRequiredStringValidation(model.name) &&
      willPassRequiredStringValidation(model.email) &&
      willPassEmailValidation(model.email) &&
      willPassRequiredStringValidation(model.countryCode);
    const addressCompleted = willPassRequiredStringValidation(model.address.line1);
    const fiscalCompleted =
      willPassRequiredStringValidation(model.fiscalname) &&
      willPassRequiredDateValidation(model.fiscalDateRange.start);
    const defaultsCompleted =
      willPassRequiredStringValidation(model.currencyCode) &&
      willPassRequiredStringValidation(model.dateFormatName) &&
      willPassRequiredStringValidation(model.invnumber) &&
      willPassRequiredStringValidation(model.jnumber);

    return [
      {
        value: 'basic',
        label: 'Basic details',
        description: 'Name, email, and country',
        completed: basicCompleted,
      },
      {
        value: 'address',
        label: 'Address',
        description: 'Primary address line',
        completed: addressCompleted,
      },
      {
        value: 'finance',
        label: 'Financial info',
        description: 'Fiscal name and date range',
        completed: fiscalCompleted,
      },
      {
        value: 'defaults',
        label: 'Financial setup',
        description: 'Currency and numbering',
        completed: defaultsCompleted,
      },
    ] as const;
  });
  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'defaults';
  });
  protected readonly formattedFiscalDateRangeEnd = computed(() =>
    formatDisplayDate(this.organizationModel().fiscalDateRange.end),
  );

  protected fieldError(field: OrgValidationFieldKey): string | null {
    if (!this.submitted() && !this.touched()[field]) {
      return null;
    }

    return this.validationErrors()[field] ?? null;
  }

  protected isInvalid(field: OrgValidationFieldKey): boolean {
    return this.fieldError(field) !== null;
  }

  protected markTouched(field: OrgValidationFieldKey): void {
    this.saved.set(false);
    this.touched.update((fields) => ({ ...fields, [field]: true }));
  }

  protected applyJournalNumberTemplate(template: string): void {
    this.saved.set(false);
    this.organizationModel.update((current) => ({ ...current, jnumber: template }));
    this.markTouched('jnumber');
    this.journalTemplateDialogOpen.set(false);
  }

  protected applyInvoiceNumberTemplate(template: string): void {
    this.saved.set(false);
    this.organizationModel.update((current) => ({ ...current, invnumber: template }));
    this.markTouched('invnumber');
    this.invoiceTemplateDialogOpen.set(false);
  }

  protected selectCountry(value: unknown): void {
    const countryCode = typeof value === 'string' ? value : '';
    if (!this.shouldProcessAutocompleteValue(countryCode, this.organizationModel().countryCode)) {
      return;
    }

    this.saved.set(false);
    this.markTouched('country');

    const country = this.countries().find((item) => item.code === countryCode) ?? null;
    const nextFiscalStart = country?.fiscalstart ?? '';
    const nextDateRangeStart = toDateRangeStartFromFiscalStart(
      nextFiscalStart,
      this.organizationModel().fiscalDateRange.start,
    );
    const nextDateRangeEnd = toDateRangeEnd(
      nextDateRangeStart,
      this.organizationModel().fiscalDateRange.end,
    );
  
    this.organizationModel.update((current) => ({
      ...current,
      countryCode,
      currencyCode: country?.currencycode ?? '',
      dateFormatName: country?.dateformat ?? '',
      fiscalstart: nextFiscalStart,
      fiscalDateRange: {
        ...current.fiscalDateRange,
        start: nextDateRangeStart,
        end: nextDateRangeEnd,
      },
      mobile: country ? `+${country.phone}-` : '',
    }));

    if (nextFiscalStart.length > 0) {
      this.markTouched('fiscalDateRange.start');
      this.markTouched('fiscalDateRange.end');
    }
  
    if (country?.currencycode) {
      this.markTouched('currency');
    }
  
    if (country?.dateformat) {
      this.markTouched('dateformatForm');
    }
  }

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
    void this.dateFormatStore.load();
  }

  protected onDateRangeStartChange(value: unknown): void {
    this.saved.set(false);
    this.markTouched('fiscalDateRange.start');

    this.organizationModel.update((current) => {
      const start = toIsoDate(value, current.fiscalDateRange.start);
      return {
        ...current,
        fiscalDateRange: {
          ...current.fiscalDateRange,
          start,
          end: toDateRangeEnd(start, current.fiscalDateRange.end),
        },
      };
    });

    this.markTouched('fiscalDateRange.end');
  }

  protected selectCurrency(value: unknown): void {
    const currencyCode = typeof value === 'string' ? value : '';
    if (!this.shouldProcessAutocompleteValue(currencyCode, this.organizationModel().currencyCode)) {
      return;
    }

    this.saved.set(false);
    this.markTouched('currency');

    this.organizationModel.update((current) => ({
      ...current,
      currencyCode,
    }));
  }

  protected selectDateFormat(value: unknown): void {
    const dateFormatName = typeof value === 'string' ? value : '';
    if (!this.shouldProcessAutocompleteValue(dateFormatName, this.organizationModel().dateFormatName)) {
      return;
    }

    this.saved.set(false);
    this.markTouched('dateformatForm');

    this.organizationModel.update((current) => ({
      ...current,
      dateFormatName,
    }));
  }

  protected onCountryQueryChnage(event: unknown): void {
    this.countryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onCurrencyQueryChnage(event: unknown): void {
    this.currencyQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onDateFormatQueryChnage(event: unknown): void {
    this.dateFormatQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected submitForm(event: SubmitEvent): void {
    event.preventDefault();

    if (this.isSubmitting()) {
      return;
    }

    this.submitted.set(true);
    this.markAllTouched();

    if (Object.keys(this.validationErrors()).length > 0) {
      this.saved.set(false);
      return;
    }

    void this.createOrganization();
  }

  protected resetForm(): void {
    this.organizationModel.set(createInitialForm());
    this.submitted.set(false);
    this.touched.set({});
    this.saved.set(false);
  }

  private markAllTouched(): void {
    const fields: readonly OrgValidationFieldKey[] = [
      'name',
      'email',
      'mobile',
      'state',
      'description',
      'gstin',
      'fiscalname',
      'invnumber',
      'jnumber',
      'address.line1',
      'address.line2',
      'address.city',
      'address.pincode',
      'country',
      'currency',
      'dateformatForm',
      'fiscalDateRange.start',
      'fiscalDateRange.end',
    ];

    this.touched.set(
      fields.reduce<Partial<Record<OrgValidationFieldKey, true>>>(
        (result, field) => ({ ...result, [field]: true }),
        {},
      ),
    );
  }

  private shouldProcessAutocompleteValue(nextValue: string, currentValue: string): boolean {
    if (nextValue.trim().length > 0) {
      return true;
    }

    // Ignore noisy empty emissions from autocomplete after selection/blur,
    // otherwise previously selected values get cleared unexpectedly.
    return false;
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

  private async createOrganization(): Promise<void> {
    const payload = this.formValue();
    if (!payload.country || !payload.currency) {
      this.saved.set(false);
      return;
    }

    const appConfig = this.appConfigStore.config() ?? (await this.appConfigStore.load());
    if (!appConfig) {
      this.saved.set(false);
      this.toastStore.danger('Unable to load app configuration.');
      return;
    }

    const [startDateRaw, enddate] = payload.fiscaldaterange;
    const parsedStartDate = dayjs(startDateRaw);
    const startdate = parsedStartDate.isValid()
      ? parsedStartDate.format(DEFAULT_NODE_DATE_FORMAT)
      : startDateRaw;
    const request: BootstrapOrganizationPayload = {
      name: payload.name,
      email: payload.email,
      ...(payload.mobile && { mobile: payload.mobile }),
      address: payload.address,
      ...(payload.description && { description: payload.description }),
      countrycode: payload.country.code,
      ...(payload.state && { state: payload.state }),
      currencycode: payload.currency.code,
      fiscalstart: payload.fiscalstart,
      fiscalname: payload.fiscalname,
      ...(payload.gstin && { gstin: payload.gstin }),
      invnumber: payload.invnumber,
      jnumber: payload.jnumber,
      dateformat: payload.dateformatForm?.name ?? '',
      startdate,
      enddate,
    };

    this.isSubmitting.set(true);

    try {
      await this.bootstrapOrganizationStore.bootstrapOrganization(
        appConfig.apiBaseUrl,
        request,
      );
      const session = await this.userSessionService.createUserSession(
        appConfig.apiBaseUrl,
      );
      this.userSessionStore.setSession(session);
      this.saved.set(true);
      this.toastStore.success('Organization created successfully.');
      await this.router.navigateByUrl('/app/dashboard');
    } catch (error) {
      this.saved.set(false);
      const message =
        error instanceof Error ? error.message : 'Failed to create organization. Please try again.';
      this.toastStore.danger(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

}