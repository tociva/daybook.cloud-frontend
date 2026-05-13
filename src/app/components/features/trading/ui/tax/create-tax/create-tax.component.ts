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
import { Status, TaxFacade, TaxStore } from '../../../data/tax';
import type { TaxPayload } from '../../../data/tax';

type TaxFormModel = {
  appliedto: string;
  description: string;
  name: string;
  rate: string;
  shortname: string;
};

@Component({
  selector: 'app-create-tax',
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
  templateUrl: './create-tax.component.html',
  styleUrl: './create-tax.component.css',
})
export class CreateTaxComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TaxFacade);
  protected readonly taxStore = inject(TaxStore);
  protected readonly taxModel = signal<TaxFormModel>({
    appliedto: '',
    description: '',
    name: '',
    rate: '',
    shortname: '',
  });
  protected readonly taxForm = form(this.taxModel);
  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit Tax' : 'Create Tax'));
  protected readonly nameError = computed(() =>
    this.submitted() && this.taxModel().name.trim().length === 0 ? 'Name is required' : null,
  );
  protected readonly shortnameError = computed(() =>
    this.submitted() && this.taxModel().shortname.trim().length === 0
      ? 'Short name is required'
      : null,
  );
  protected readonly rateError = computed(() =>
    this.submitted() ? this.getNumberError(this.taxModel().rate, 'Rate') : null,
  );
  protected readonly appliedToError = computed(() =>
    this.submitted() ? this.getNumberError(this.taxModel().appliedto, 'Applied to') : null,
  );

  protected readonly setupSteps = computed(() => {
    const model = this.taxModel();
    const identityCompleted = model.name.trim().length > 0 && model.shortname.trim().length > 0;
    const rateCompleted =
      this.isValidNonNegativeNumber(model.rate) && this.isValidNonNegativeNumber(model.appliedto);
    const notesCompleted = model.description.trim().length > 0;

    return [
      {
        value: 'identity',
        label: 'Tax identity',
        description: 'Name and short name',
        completed: identityCompleted,
      },
      {
        value: 'rate',
        label: 'Rate setup',
        description: 'Rate and applied-to value',
        completed: rateCompleted,
      },
      {
        value: 'notes',
        label: 'Notes',
        description: 'Optional description',
        completed: notesCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'notes';
  });

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
      this.taxStore.clearSelectedItem();
      return;
    }

    const tax = await this.taxStore.loadTaxById(id);
    if (tax) {
      this.taxModel.set({
        appliedto: String(tax.appliedto ?? ''),
        description: tax.description ?? '',
        name: tax.name,
        rate: String(tax.rate ?? ''),
        shortname: tax.shortname,
      });
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.shortnameError() || this.rateError() || this.appliedToError()) {
      return;
    }

    const model = this.taxModel();
    const payload: TaxPayload = {
      appliedto: Number(model.appliedto),
      name: model.name.trim(),
      rate: Number(model.rate),
      shortname: model.shortname.trim(),
      status: this.taxStore.selectedItem()?.status ?? Status.ACTIVE,
      ...(model.description.trim() ? { description: model.description.trim() } : {}),
    };
    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
    }
  }

  private getNumberError(value: string, label: string): string | null {
    if (value.trim().length === 0) {
      return `${label} is required`;
    }

    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return `${label} must be zero or greater`;
    }

    return null;
  }

  private isValidNonNegativeNumber(value: string): boolean {
    if (value.trim().length === 0) {
      return false;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= 0;
  }
}
