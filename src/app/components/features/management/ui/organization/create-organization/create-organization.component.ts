import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { CountryStore } from '../../../data/country/country.store';
import type { Country } from '../../../data/country/country.model';
import { CurrencyStore } from '../../../data/currency/currency.store';
import type { Currency } from '../../../data/currency/currency.model';
import { OrganizationFacade, OrganizationStore } from '../../../data/organization';
import type { OrganizationPayload } from '../../../data/organization';

@Component({
  selector: 'app-create-organization',
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
    TngTextareaComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-organization.component.html',
  styleUrls: ['./create-organization.component.css', '../../../../../../../styles/flags.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganizationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationFacade);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly countryStore = inject(CountryStore);
  protected readonly currencyStore = inject(CurrencyStore);

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

  // ── Country/Currency autocomplete ─────────────────────────────────────────
  protected readonly countries = this.countryStore.countries;
  protected readonly currencies = this.currencyStore.currencies;
  protected readonly countryQuery = signal('');
  protected readonly currencyQuery = signal('');
  protected readonly countryCurrencyModel = signal({ countrycode: '', currencycode: '' });
  protected readonly countryCurrencyForm = form(this.countryCurrencyModel);

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

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Organization' : 'New Organization',
  );
  protected readonly description_ = computed(() =>
    this.mode() === 'edit'
      ? 'Update basic organization details.'
      : 'Fill in the details to create a new organization.',
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
  protected readonly hasErrors = computed(
    () =>
      this.nameError() !== null ||
      this.emailError() !== null ||
      this.addressLine1Error() !== null,
  );

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
  }

  async ngOnInit(): Promise<void> {
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
        const orgWithCodes = org as { countrycode?: string; currencycode?: string };
        this.countryCurrencyModel.set({
          countrycode: orgWithCodes.countrycode ?? '',
          currencycode: orgWithCodes.currencycode ?? '',
        });
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
    }));

    if (!this.mobile() || this.mobile() === '') {
      this.mobile.set(country ? `+${country.phone}-` : '');
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

  protected onCountryQueryChnage(event: unknown): void {
    this.countryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onCurrencyQueryChnage(event: unknown): void {
    this.currencyQuery.set(this.normalizeAutocompleteQuery(event));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    if (this.hasErrors()) return;

    this.isSubmitting.set(true);
    const payload: OrganizationPayload = {
      name: this.name().trim(),
      email: this.email().trim(),
      ...(this.mobile().trim() && { mobile: this.mobile().trim() }),
      ...(this.description().trim() && { description: this.description().trim() }),
      ...(this.state().trim() && { state: this.state().trim() }),
      ...(this.gstin().trim() && { gstin: this.gstin().trim() }),
      ...(this.countryCurrencyModel().countrycode && {
        countrycode: this.countryCurrencyModel().countrycode,
      }),
      address: {
        line1: this.addressLine1().trim(),
        ...(this.addressLine2().trim() && { line2: this.addressLine2().trim() }),
        ...(this.addressCity().trim() && { city: this.addressCity().trim() }),
        ...(this.addressPincode().trim() && { pincode: this.addressPincode().trim() }),
      },
    };

    try {
      const id = this.id();
      if (id) {
        await this.facade.update(id, payload);
      } else {
        await this.facade.create(payload);
      }
    } finally {
      this.isSubmitting.set(false);
    }
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
