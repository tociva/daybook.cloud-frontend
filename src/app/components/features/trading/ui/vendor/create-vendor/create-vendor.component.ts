import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
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
  TngError,
  TngFormFieldComponent,
  TngInputComponent,
  TngLabelComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { VendorFacade, VendorStore } from '../../../data/vendor';
import type { VendorPayload } from '../../../data/vendor';

type VendorFormModel = {
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  pan: string;
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
  selector: 'app-create-vendor',
  standalone: true,
  imports: [
    FormField,
    TngButtonComponent,
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngError,
    TngFormFieldComponent,
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngStepperComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-vendor.component.html',
  styleUrl: './create-vendor.component.css',
})
export class CreateVendorComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(VendorFacade);
  protected readonly vendorStore = inject(VendorStore);

  protected readonly vendorModel = signal<VendorFormModel>({
    name: '',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
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
  protected readonly vendorForm = form(this.vendorModel);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Vendor' : 'New Vendor',
  );

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly nameError = computed(() =>
    this.submitted() && this.vendorModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly countrycodeError = computed(() =>
    this.submitted() && this.vendorModel().countrycode.trim() === ''
      ? 'Country code is required.'
      : null,
  );
  protected readonly currencycodeError = computed(() =>
    this.submitted() && this.vendorModel().currencycode.trim() === ''
      ? 'Currency code is required.'
      : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.vendorModel();
    const identityCompleted =
      m.name.trim().length > 0 &&
      m.countrycode.trim().length > 0 &&
      m.currencycode.trim().length > 0;
    const contactCompleted = m.mobile.trim().length > 0 || m.email.trim().length > 0;
    const addressCompleted = m.addressName.trim().length > 0 && m.addressLine1.trim().length > 0;

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
        description: 'Mobile, email, GSTIN & PAN',
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
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.vendorStore.clearSelectedItem();
      return;
    }

    const vendor = await this.vendorStore.loadVendorById(id);
    if (vendor) {
      this.vendorModel.set({
        name: vendor.name ?? '',
        mobile: vendor.mobile ?? '',
        email: vendor.email ?? '',
        gstin: vendor.gstin ?? '',
        pan: vendor.pan ?? '',
        countrycode: vendor.countrycode ?? '',
        currencycode: vendor.currencycode ?? '',
        state: vendor.state ?? '',
        description: vendor.description ?? '',
        addressName: vendor.address?.name ?? '',
        addressLine1: vendor.address?.line1 ?? '',
        addressLine2: vendor.address?.line2 ?? '',
        addressStreet: vendor.address?.street ?? '',
        addressCity: vendor.address?.city ?? '',
        addressZip: vendor.address?.zip ?? '',
      });
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.countrycodeError() || this.currencycodeError()) {
      return;
    }

    const m = this.vendorModel();
    const payload: VendorPayload = {
      name: m.name.trim(),
      ...(m.mobile.trim() ? { mobile: m.mobile.trim() } : {}),
      ...(m.email.trim() ? { email: m.email.trim() } : {}),
      ...(m.gstin.trim() ? { gstin: m.gstin.trim() } : {}),
      ...(m.pan.trim() ? { pan: m.pan.trim() } : {}),
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
}
