import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
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
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { CustomerFacade, CustomerStore } from '../../../data/customer';
import type { CustomerPayload } from '../../../data/customer';
import type { Country } from '../../../../management/data/country/country.model';
import { CountryStore } from '../../../../management/data/country/country.store';
import type { Currency } from '../../../../management/data/currency/currency.model';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';

type CustomerFormModel = {
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  countrycode: string;
  currencycode: string;
  state: string;
  description: string;
  addressName: string;
  addressLine1: string;
  addressLine2: string;
  addressStreet: string;
  addressCity: string;
  addressZip: string;
};

@Component({
  selector: 'app-create-customer',
  standalone: true,
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
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngStepperComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-customer.component.html',
  styleUrls: ['./create-customer.component.css', '../../../../../../../styles/flags.css'],
})
export class CreateCustomerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(CustomerFacade);
  private readonly countryStore = inject(CountryStore);
  private readonly currencyStore = inject(CurrencyStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly countries = this.countryStore.countries;
  protected readonly currencies = this.currencyStore.currencies;
  protected readonly countryQuery = signal('');
  protected readonly currencyQuery = signal('');

  protected readonly countryOptionValue = (country: Country): string => country.code;
  protected readonly countryOptionLabel = (country: Country): string => country.name;
  protected readonly countryTrackBy = (_index: number, country: Country): string => country.code;
  protected readonly getCountryFlagClass = (country: Country): string =>
    `country-flag country-flag--${country.code.toLowerCase()}`;
  protected readonly currencyOptionValue = (currency: Currency): string => currency.code;
  protected readonly currencyOptionLabel = (currency: Currency): string =>
    `${currency.name} (${currency.symbol})`;
  protected readonly currencyTrackBy = (_index: number, currency: Currency): string => currency.code;
  protected readonly filteredCountries = computed(() =>
    this.filterAutocompleteOptions(this.countries(), this.countryOptionLabel, this.countryQuery()),
  );
  protected readonly filteredCurrencies = computed(() =>
    this.filterAutocompleteOptions(this.currencies(), this.currencyOptionLabel, this.currencyQuery()),
  );

  protected readonly customerModel = signal<CustomerFormModel>({
    name: '',
    mobile: '',
    email: '',
    gstin: '',
    countrycode: '',
    currencycode: '',
    state: '',
    description: '',
    addressName: '',
    addressLine1: '',
    addressLine2: '',
    addressStreet: '',
    addressCity: '',
    addressZip: '',
  });
  protected readonly customerForm = form(this.customerModel);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Customer' : 'New Customer',
  );

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly nameError = computed(() =>
    this.submitted() && this.customerModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly countrycodeError = computed(() =>
    this.submitted() && this.customerModel().countrycode.trim() === ''
      ? 'Country code is required.'
      : null,
  );
  protected readonly currencycodeError = computed(() =>
    this.submitted() && this.customerModel().currencycode.trim() === ''
      ? 'Currency code is required.'
      : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.customerModel();
    const identityCompleted =
      m.name.trim().length > 0 &&
      m.countrycode.trim().length > 0 &&
      m.currencycode.trim().length > 0;
    const contactCompleted = m.mobile.trim().length > 0 || m.email.trim().length > 0;
    const addressCompleted =
      m.addressName.trim().length > 0 && m.addressLine1.trim().length > 0;

    return [
      {
        value: 'identity',
        label: 'Identity',
        description: 'Name, country & currency',
        completed: identityCompleted,
      },
      {
        value: 'contact',
        label: 'Contact',
        description: 'Mobile, email & GSTIN',
        completed: contactCompleted,
      },
      {
        value: 'address',
        label: 'Address',
        description: 'Billing / delivery address',
        completed: addressCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'address';
  });

  // ──────────────────────────────────────────────────────────────────────────

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.customerStore.clearSelectedItem();
      return;
    }

    const customer = await this.customerStore.loadCustomerById(id);
    if (customer) {
      this.customerModel.set({
        name: customer.name ?? '',
        mobile: customer.mobile ?? '',
        email: customer.email ?? '',
        gstin: customer.gstin ?? '',
        countrycode: customer.countrycode ?? '',
        currencycode: customer.currencycode ?? '',
        state: customer.state ?? '',
        description: customer.description ?? '',
        addressName: customer.address?.name ?? '',
        addressLine1: customer.address?.line1 ?? '',
        addressLine2: customer.address?.line2 ?? '',
        addressStreet: customer.address?.street ?? '',
        addressCity: customer.address?.city ?? '',
        addressZip: customer.address?.zip ?? '',
      });
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.countrycodeError() || this.currencycodeError()) {
      return;
    }

    const m = this.customerModel();
    const payload: CustomerPayload = {
      name: m.name.trim(),
      ...(m.mobile.trim() ? { mobile: m.mobile.trim() } : {}),
      ...(m.email.trim() ? { email: m.email.trim() } : {}),
      ...(m.gstin.trim() ? { gstin: m.gstin.trim() } : {}),
      countrycode: m.countrycode.trim(),
      currencycode: m.currencycode.trim(),
      ...(m.state.trim() ? { state: m.state.trim() } : {}),
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      address: {
        name: m.addressName.trim(),
        line1: m.addressLine1.trim(),
        ...(m.addressLine2.trim() ? { line2: m.addressLine2.trim() } : {}),
        ...(m.addressStreet.trim() ? { street: m.addressStreet.trim() } : {}),
        ...(m.addressCity.trim() ? { city: m.addressCity.trim() } : {}),
        ...(m.state.trim() ? { state: m.state.trim() } : {}),
        ...(m.addressZip.trim() ? { zip: m.addressZip.trim() } : {}),
        country: m.countrycode.trim(),
      },
      status: 1,
    };

    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
    }
  }

  protected selectCountry(value: unknown): void {
    const countryCode = typeof value === 'string' ? value : '';
    if (!countryCode.trim()) {
      return;
    }

    const country = this.countries().find((item) => item.code === countryCode) ?? null;

    this.customerModel.update((current) => ({
      ...current,
      countrycode: countryCode,
      currencycode: country?.currencycode ?? current.currencycode,
      mobile: country ? `+${country.phone}-` : current.mobile,
    }));
  }

  protected selectCurrency(value: unknown): void {
    const currencyCode = typeof value === 'string' ? value : '';
    if (!currencyCode.trim()) {
      return;
    }

    this.customerModel.update((current) => ({
      ...current,
      currencycode: currencyCode,
    }));
  }

  protected onCountryQueryChnage(event: unknown): void {
    this.countryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onCurrencyQueryChnage(event: unknown): void {
    this.currencyQuery.set(this.normalizeAutocompleteQuery(event));
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
