import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
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
  TngInputComponent,
  TngLabelComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { Country } from '../../core/country/country.model';
import { CountryStore } from '../../core/country/country.store';
import { Currency } from '../../core/currency/currency.model';
import { CurrencyStore } from '../../core/currency/currency.store';
import { DateFormat } from '../../core/date-format/date-format.model';
import { DateFormatStore } from '../../core/date-format/date-format.store';

const DEFAULT_INVOICE_NUMBER_FORMAT = 'INV-{YYYY}-{0000}';
const DEFAULT_JOURNAL_NUMBER_FORMAT = 'JV-{YYYY}-{0000}';

type OrgValidationFieldKey =
  | 'name'
  | 'email'
  | 'mobile'
  | 'state'
  | 'description'
  | 'gstin'
  | 'fiscalstart'
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

const getCurrentFiscalDateRange = (): { start: string; end: string } => {
  const year = new Date().getFullYear();

  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
  };
};

const toFlagEmoji = (countryCode: string): string =>
  countryCode
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));

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
    TngInputComponent,
    TngLabelComponent,
    TngTextareaComponent,
  ],
  templateUrl: './bootstrap-organization.component.html',
  styleUrls: ['./bootstrap-organization.component.css', '../../../styles/flags.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootstrapOrganizationComponent {
  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly dateFormatStore = inject(DateFormatStore);
  protected readonly countries = this.countryStore.countries;
  protected readonly currencies = this.currencyStore.currencies;
  protected readonly dateFormats = this.dateFormatStore.dateFormats;

  protected readonly organizationModel = signal<OrganizationSignalFormModel>(createInitialForm());
  protected readonly organizationForm = form(this.organizationModel);

  protected readonly submitted = signal(false);
  protected readonly saved = signal(false);
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

    if (!willPassRequiredStringValidation(model.fiscalstart)) {
      errors.fiscalstart = 'Fiscal Start is required';
    }

    if (!willPassRequiredStringValidation(model.fiscalname)) {
      errors.fiscalname = 'Fiscal Name is required';
    }

    if (!willPassRequiredStringValidation(model.fiscalDateRange.start)) {
      errors['fiscalDateRange.start'] = 'Start Date is required';
    }

    if (!willPassRequiredStringValidation(model.fiscalDateRange.end)) {
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

  protected selectCountry(value: unknown): void {
    this.saved.set(false);
    this.markTouched('country');

    const countryCode = typeof value === 'string' ? value : '';
    const country = this.countries().find((item) => item.code === countryCode) ?? null;
    const currency = country
      ? (this.currencies().find((item) => item.code === country.currencycode) ?? null)
      : null;
    const dateFormat = country
      ? (this.dateFormats().find((item) => item.name === country.dateformat) ?? null)
      : null;

    this.organizationModel.update((current) => ({
      ...current,
      countryCode,
      currencyCode: currency?.code ?? current.currencyCode,
      dateFormatName: dateFormat?.name ?? current.dateFormatName,
      fiscalstart: country?.fiscalstart ?? current.fiscalstart,
      mobile: country ? `+${country.phone}-` : current.mobile,
    }));

    if (currency) {
      this.markTouched('currency');
    }

    if (dateFormat) {
      this.markTouched('dateformatForm');
    }
  }

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
    void this.dateFormatStore.load();
  }

  protected selectCurrency(value: unknown): void {
    this.saved.set(false);
    this.markTouched('currency');

    this.organizationModel.update((current) => ({
      ...current,
      currencyCode: typeof value === 'string' ? value : '',
    }));
  }

  protected selectDateFormat(value: unknown): void {
    this.saved.set(false);
    this.markTouched('dateformatForm');

    this.organizationModel.update((current) => ({
      ...current,
      dateFormatName: typeof value === 'string' ? value : '',
    }));
  }

  protected submitForm(event: SubmitEvent): void {
    event.preventDefault();

    this.submitted.set(true);
    this.markAllTouched();

    if (Object.keys(this.validationErrors()).length > 0) {
      this.saved.set(false);
      return;
    }

    this.saved.set(true);
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
      'fiscalstart',
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
}