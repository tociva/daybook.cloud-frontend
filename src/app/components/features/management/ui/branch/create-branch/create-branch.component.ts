import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
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
import { OrganizationStore } from '../../../data/organization/organization.store';
import type { Organization } from '../../../data/organization/organization.model';
import { BranchFacade, BranchStore } from '../../../data/branch';
import type { BranchPayload } from '../../../data/branch';
import {
  DEFAULT_INVOICE_NUMBER_FORMAT,
  DEFAULT_RECEIPT_NUMBER_FORMAT,
} from '../../../../../../util/constants';

@Component({
  selector: 'app-create-branch',
  standalone: true,
  imports: [
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
  templateUrl: './create-branch.component.html',
  styleUrl: './create-branch.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBranchComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(BranchFacade);
  protected readonly branchStore = inject(BranchStore);
  protected readonly countryStore = inject(CountryStore);
  protected readonly currencyStore = inject(CurrencyStore);
  protected readonly dateFormatStore = inject(DateFormatStore);
  protected readonly organizationStore = inject(OrganizationStore);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly isSubmitting = signal(false);

  // ── Basic form fields ─────────────────────────────────────────────────────
  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly mobile = signal('');
  protected readonly description = signal('');
  protected readonly state = signal('');
  protected readonly gstin = signal('');

  // ── Address ───────────────────────────────────────────────────────────────
  protected readonly addressLine1 = signal('');
  protected readonly addressLine2 = signal('');
  protected readonly addressCity = signal('');
  protected readonly addressPincode = signal('');

  // ── Settings ──────────────────────────────────────────────────────────────
  protected readonly fiscalstart = signal('January-01');
  protected readonly timezone = signal('Asia/Kolkata');
  protected readonly invnumber = signal(DEFAULT_INVOICE_NUMBER_FORMAT);
  protected readonly recnumber = signal(DEFAULT_RECEIPT_NUMBER_FORMAT);

  // ── Country autocomplete ──────────────────────────────────────────────────
  protected readonly selectedCountry = signal<Country | null>(null);
  protected readonly countrySearch = signal('');
  protected readonly showCountryDropdown = signal(false);

  protected readonly filteredCountries = computed(() => {
    const q = this.countrySearch().toLowerCase().trim();
    const all = this.countryStore.countries();
    if (!q) return all.slice(0, 20);
    return all
      .filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 20);
  });

  // ── Currency autocomplete ─────────────────────────────────────────────────
  protected readonly selectedCurrency = signal<Currency | null>(null);
  protected readonly currencySearch = signal('');
  protected readonly showCurrencyDropdown = signal(false);

  protected readonly filteredCurrencies = computed(() => {
    const q = this.currencySearch().toLowerCase().trim();
    const all = this.currencyStore.currencies();
    if (!q) return all.slice(0, 20);
    return all
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.symbol.includes(q),
      )
      .slice(0, 20);
  });

  // ── Date-format autocomplete ──────────────────────────────────────────────
  protected readonly selectedDateFormat = signal<DateFormat | null>(null);
  protected readonly dateFormatSearch = signal('');
  protected readonly showDateFormatDropdown = signal(false);

  protected readonly filteredDateFormats = computed(() => {
    const q = this.dateFormatSearch().toLowerCase().trim();
    const all = this.dateFormatStore.dateFormats();
    if (!q) return all.slice(0, 20);
    return all
      .filter((df) => df.name.toLowerCase().includes(q) || df.example.toLowerCase().includes(q))
      .slice(0, 20);
  });

  // ── Organization autocomplete ─────────────────────────────────────────────
  protected readonly selectedOrganization = signal<Organization | null>(null);
  protected readonly orgSearch = signal('');
  protected readonly showOrgDropdown = signal(false);

  protected readonly filteredOrganizations = computed(() => {
    const q = this.orgSearch().toLowerCase().trim();
    const all = this.organizationStore.items();
    if (!q) return all.slice(0, 20);
    return all
      .filter((o) => o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q))
      .slice(0, 20);
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Branch' : 'New Branch',
  );
  protected readonly subtitle = computed(() =>
    this.mode() === 'edit'
      ? 'Update branch details and settings.'
      : 'Fill in the details to create a new branch.',
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
  protected readonly countryError = computed(() =>
    this.submitted() && !this.selectedCountry() ? 'Country is required.' : null,
  );
  protected readonly currencyError = computed(() =>
    this.submitted() && !this.selectedCurrency() ? 'Currency is required.' : null,
  );
  protected readonly dateFormatError = computed(() =>
    this.submitted() && !this.selectedDateFormat() ? 'Date format is required.' : null,
  );
  protected readonly organizationError = computed(() =>
    this.submitted() && !this.selectedOrganization() ? 'Organization is required.' : null,
  );
  protected readonly fiscalstartError = computed(() =>
    this.submitted() && this.fiscalstart().trim() === '' ? 'Fiscal start is required.' : null,
  );
  protected readonly invnumberError = computed(() =>
    this.submitted() && this.invnumber().trim() === ''
      ? 'Invoice number format is required.'
      : null,
  );
  protected readonly recnumberError = computed(() =>
    this.submitted() && this.recnumber().trim() === ''
      ? 'Receipt number format is required.'
      : null,
  );
  protected readonly hasErrors = computed(
    () =>
      this.nameError() !== null ||
      this.emailError() !== null ||
      this.countryError() !== null ||
      this.currencyError() !== null ||
      this.dateFormatError() !== null ||
      this.organizationError() !== null ||
      this.fiscalstartError() !== null ||
      this.invnumberError() !== null ||
      this.recnumberError() !== null,
  );

  constructor() {
    void this.countryStore.load();
    void this.currencyStore.load();
    void this.dateFormatStore.load();
    void this.organizationStore.loadOrganizations();
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    this.branchStore.clearError();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      const branch = await this.branchStore.loadBranchById(id, {
        includes: ['organization', 'country'],
      });
      if (branch) {
        this.name.set(branch.name ?? '');
        this.email.set(branch.email ?? '');
        this.mobile.set(branch.mobile ?? '');
        this.description.set(branch.description ?? '');
        this.state.set(branch.state ?? '');
        this.gstin.set(branch.gstin ?? '');
        this.fiscalstart.set(branch.fiscalstart ?? 'January-01');
        this.timezone.set(branch.timezone ?? 'Asia/Kolkata');
        this.invnumber.set(branch.invnumber ?? DEFAULT_INVOICE_NUMBER_FORMAT);
        this.recnumber.set(branch.recnumber ?? DEFAULT_RECEIPT_NUMBER_FORMAT);

        const addr = branch.address as
          | { line1?: string; line2?: string; city?: string; pincode?: string }
          | undefined;
        this.addressLine1.set(addr?.line1 ?? '');
        this.addressLine2.set(addr?.line2 ?? '');
        this.addressCity.set(addr?.city ?? '');
        this.addressPincode.set(addr?.pincode ?? '');

        // Pre-fill autocomplete fields
        const country = this.countryStore.countries().find((c) => c.code === branch.countrycode);
        if (country) {
          this.selectedCountry.set(country);
          this.countrySearch.set(country.name);
        }

        const currency = this.currencyStore
          .currencies()
          .find((c) => c.code === branch.currencycode);
        if (currency) {
          this.selectedCurrency.set(currency);
          this.currencySearch.set(`${currency.name} (${currency.symbol})`);
        }

        const df = this.dateFormatStore.dateFormats().find((d) => d.name === branch.dateformat);
        if (df) {
          this.selectedDateFormat.set(df);
          this.dateFormatSearch.set(`${df.name} (${df.example})`);
        }

        if (branch.organization) {
          this.selectedOrganization.set(branch.organization);
          this.orgSearch.set(branch.organization.name);
        }
      }
    }
  }

  // ── Country handlers ──────────────────────────────────────────────────────
  protected onCountryInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.countrySearch.set(v);
    this.showCountryDropdown.set(true);
    if (!v.trim()) this.selectedCountry.set(null);
  }

  protected selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.countrySearch.set(country.name);
    this.showCountryDropdown.set(false);
    // Auto-fill currency & mobile prefix from country
    const currency = this.currencyStore.currencies().find((c) => c.code === country.currencycode);
    if (currency && !this.selectedCurrency()) {
      this.selectedCurrency.set(currency);
      this.currencySearch.set(`${currency.name} (${currency.symbol})`);
    }
    const df = this.dateFormatStore.dateFormats().find((d) => d.name === country.dateformat);
    if (df && !this.selectedDateFormat()) {
      this.selectedDateFormat.set(df);
      this.dateFormatSearch.set(`${df.name} (${df.example})`);
    }
    if (!this.mobile().trim()) {
      this.mobile.set(`+${country.phone}-`);
    }
    if (!this.fiscalstart().trim() || this.fiscalstart() === 'January-01') {
      this.fiscalstart.set(country.fiscalstart ?? 'January-01');
    }
  }

  protected onCountryBlur(): void {
    this.showCountryDropdown.set(false);
  }

  // ── Currency handlers ─────────────────────────────────────────────────────
  protected onCurrencyInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.currencySearch.set(v);
    this.showCurrencyDropdown.set(true);
    if (!v.trim()) this.selectedCurrency.set(null);
  }

  protected selectCurrency(currency: Currency): void {
    this.selectedCurrency.set(currency);
    this.currencySearch.set(`${currency.name} (${currency.symbol})`);
    this.showCurrencyDropdown.set(false);
  }

  protected onCurrencyBlur(): void {
    this.showCurrencyDropdown.set(false);
  }

  // ── Date-format handlers ──────────────────────────────────────────────────
  protected onDateFormatInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.dateFormatSearch.set(v);
    this.showDateFormatDropdown.set(true);
    if (!v.trim()) this.selectedDateFormat.set(null);
  }

  protected selectDateFormat(df: DateFormat): void {
    this.selectedDateFormat.set(df);
    this.dateFormatSearch.set(`${df.name} (${df.example})`);
    this.showDateFormatDropdown.set(false);
  }

  protected onDateFormatBlur(): void {
    this.showDateFormatDropdown.set(false);
  }

  // ── Organization handlers ─────────────────────────────────────────────────
  protected onOrgInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.orgSearch.set(v);
    this.showOrgDropdown.set(true);
    if (!v.trim()) this.selectedOrganization.set(null);
  }

  protected selectOrganization(org: Organization): void {
    this.selectedOrganization.set(org);
    this.orgSearch.set(org.name);
    this.showOrgDropdown.set(false);
  }

  protected onOrgBlur(): void {
    this.showOrgDropdown.set(false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.submitted.set(true);
    if (this.hasErrors()) return;

    this.isSubmitting.set(true);
    const payload: BranchPayload = {
      name: this.name().trim(),
      email: this.email().trim(),
      organizationid: this.selectedOrganization()!.id!,
      countrycode: this.selectedCountry()!.code,
      currencycode: this.selectedCurrency()!.code,
      dateformat: this.selectedDateFormat()!.name,
      fiscalstart: this.fiscalstart().trim(),
      timezone: this.timezone().trim(),
      invnumber: this.invnumber().trim(),
      recnumber: this.recnumber().trim(),
      ...(this.mobile().trim() && { mobile: this.mobile().trim() }),
      ...(this.description().trim() && { description: this.description().trim() }),
      ...(this.state().trim() && { state: this.state().trim() }),
      ...(this.gstin().trim() && { gstin: this.gstin().trim() }),
      address: {
        line1: this.addressLine1().trim(),
        ...(this.addressLine2().trim() && { line2: this.addressLine2().trim() }),
        ...(this.addressCity().trim() && { city: this.addressCity().trim() }),
        ...(this.addressPincode().trim() && { pincode: this.addressPincode().trim() }),
      },
    };

    try {
      const branchId = this.id();
      if (branchId) {
        await this.facade.update(branchId, payload);
      } else {
        await this.facade.create(payload);
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
