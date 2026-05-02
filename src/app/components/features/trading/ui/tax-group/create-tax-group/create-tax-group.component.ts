import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
  TngInputComponent,
  TngLabelComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroupPayload } from '../../../data/tax-group';

type TaxGroupFormModel = {
  description: string;
  name: string;
  rate: string;
};

@Component({
  selector: 'app-create-tax-group',
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
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngTextareaComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-tax-group.component.html',
  styleUrl: './create-tax-group.component.css',
})
export class CreateTaxGroupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly taxGroupModel = signal<TaxGroupFormModel>({
    description: '',
    name: '',
    rate: '',
  });
  protected readonly taxGroupForm = form(this.taxGroupModel);
  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Tax Group' : 'Create Tax Group',
  );
  protected readonly nameError = computed(() =>
    this.submitted() && this.taxGroupModel().name.trim().length === 0 ? 'Name is required' : null,
  );
  protected readonly rateError = computed(() =>
    this.submitted() ? this.getNumberError(this.taxGroupModel().rate, 'Rate') : null,
  );

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.taxGroupStore.clearSelectedItem();
      return;
    }

    const taxGroup = await this.taxGroupStore.loadTaxGroupById(id);
    if (taxGroup) {
      this.taxGroupModel.set({
        description: taxGroup.description ?? '',
        name: taxGroup.name,
        rate: String(taxGroup.rate ?? ''),
      });
    }
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.rateError()) {
      return;
    }

    const model = this.taxGroupModel();
    const payload: TaxGroupPayload = {
      groups: this.taxGroupStore.selectedItem()?.groups ?? [],
      name: model.name.trim(),
      rate: Number(model.rate),
      ...(model.description.trim() ? { description: model.description.trim() } : {}),
    };
    const id = this.id();
    const saved = id
      ? await this.taxGroupStore.updateTaxGroup(id, payload)
      : await this.taxGroupStore.createTaxGroup(payload);

    if (saved) {
      await this.burlNavigation.navigateBack();
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
}

