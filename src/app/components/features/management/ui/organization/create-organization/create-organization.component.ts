import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
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
import { OrganizationFacade, OrganizationStore } from '../../../data/organization';
import type { OrganizationPayload } from '../../../data/organization';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
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
  styleUrl: './create-organization.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrganizationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(OrganizationFacade);
  protected readonly organizationStore = inject(OrganizationStore);
  protected readonly countryStore = inject(CountryStore);

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

  // ── Country autocomplete ──────────────────────────────────────────────────
  protected readonly selectedCountry = signal<Country | null>(null);
  protected readonly countrySearch = signal('');
  protected readonly showCountryDropdown = signal(false);

  protected readonly filteredCountries = computed(() => {
    const q = this.countrySearch().toLowerCase().trim();
    const all = this.countryStore.countries();
    if (!q) return all.slice(0, 20);
    return all.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 20);
  });

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
      }
    }
  }

  // ── Country autocomplete handlers ─────────────────────────────────────────
  protected onCountryInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.countrySearch.set(v);
    this.showCountryDropdown.set(true);
    if (!v.trim()) {
      this.selectedCountry.set(null);
    }
  }

  protected selectCountry(country: Country): void {
    this.selectedCountry.set(country);
    this.countrySearch.set(country.name);
    this.showCountryDropdown.set(false);
    if (!this.mobile() || this.mobile() === '') {
      this.mobile.set(`+${country.phone}-`);
    }
  }

  protected onCountryBlur(): void {
    setTimeout(() => this.showCountryDropdown.set(false), 200);
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
      ...(this.selectedCountry() && { countrycode: this.selectedCountry()!.code }),
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
}
