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
  TngMultiAutocompleteComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroup, TaxGroupCU } from '../../../data/tax-group';

const TAX_GROUP_MODE_SUGGESTIONS = [
  'Inter State',
  'Intra State',
  'EXPORT',
  'NON-TAXABLE',
] as const;

/** Row model: API JSON shape. */
type TaxGroupRowModel = {
  mode: string;
  taxids: string[];
};

type TaxGroupFormModel = {
  description: string;
  groups: TaxGroupRowModel[];
  name: string;
  rate: string;
};

@Component({
  selector: 'app-create-tax-group',
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
    TngIcon,
    TngInputComponent,
    TngLabelComponent,
    TngMultiAutocompleteComponent,
    TngStepperComponent,
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
  protected readonly taxStore = inject(TaxStore);

  protected readonly taxGroupModel = signal<TaxGroupFormModel>({
    description: '',
    groups: [],
    name: '',
    rate: '',
  });
  protected readonly taxGroupForm = form(this.taxGroupModel);

  protected readonly id = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Tax Group' : 'Create Tax Group',
  );

  protected readonly filteredModes = signal<string[]>([...TAX_GROUP_MODE_SUGGESTIONS]);

  protected readonly nameError = computed(() =>
    this.submitted() && this.taxGroupModel().name.trim() === '' ? 'Name is required.' : null,
  );

  protected readonly rateError = computed(() =>
    this.submitted() ? this.getNumberError(this.taxGroupModel().rate, 'Rate') : null,
  );

  protected readonly groupRowErrors = computed(() => {
    if (!this.submitted()) {
      return [] as { mode: string | null; taxids: string | null }[];
    }
    return this.taxGroupModel().groups.map((g) => ({
      mode: g.mode.trim() === '' ? 'Mode/Name is required.' : null,
      taxids: g.taxids.length === 0 ? 'Add at least one tax.' : null,
    }));
  });

  protected readonly hasAnyGroupError = computed(() =>
    this.groupRowErrors().some((e) => e.mode !== null || e.taxids !== null),
  );

  protected readonly setupSteps = computed(() => {
    const m = this.taxGroupModel();
    const basicCompleted =
      m.name.trim().length > 0 &&
      m.rate.trim().length > 0 &&
      Number.isFinite(Number(m.rate)) &&
      Number(m.rate) >= 0;
    const groupsCompleted =
      m.groups.length > 0 &&
      m.groups.every((g) => g.mode.trim().length > 0 && g.taxids.length > 0);

    return [
      {
        value: 'basic',
        label: 'Basic details',
        description: 'Name, rate, and description',
        completed: basicCompleted,
      },
      {
        value: 'groups',
        label: 'Tax groups',
        description: 'Modes and mapped taxes',
        completed: groupsCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'groups';
  });

  // ── tng-multi-autocomplete option helpers ──────────────────────────────────

  protected readonly taxOptionValue = (tax: Tax): string => tax.id ?? '';
  protected readonly taxOptionLabel = (tax: Tax): string => tax.name ?? '';
  protected readonly taxTrackBy = (_index: number, tax: Tax): string => tax.id ?? '';

  // ──────────────────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    await this.taxStore.loadTaxes({});
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id.set(routeId);

    if (!routeId) {
      this.taxGroupStore.clearSelectedItem();
      return;
    }

    const taxGroup = await this.taxGroupStore.loadTaxGroupById(routeId);
    if (taxGroup) {
      this.patchModelFromTaxGroup(taxGroup);
    }
  }

  protected onModeSearch(value: string): void {
    const q = value.trim().toLowerCase();
    this.filteredModes.set(
      q
        ? TAX_GROUP_MODE_SUGGESTIONS.filter((m) => m.toLowerCase().includes(q))
        : [...TAX_GROUP_MODE_SUGGESTIONS],
    );
  }

  protected onTaxIdsChange(groupIndex: number, ids: readonly string[]): void {
    this.taxGroupModel.update((m) => ({
      ...m,
      groups: m.groups.map((row, ri) =>
        ri !== groupIndex ? row : { ...row, taxids: [...ids] },
      ),
    }));
  }

  protected addGroup(): void {
    this.taxGroupModel.update((m) => ({
      ...m,
      groups: [...m.groups, { mode: '', taxids: [] }],
    }));
  }

  protected removeGroup(index: number): void {
    this.taxGroupModel.update((m) => ({
      ...m,
      groups: m.groups.filter((_, i) => i !== index),
    }));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (this.submitting()) {
      return;
    }

    this.submitted.set(true);

    if (this.nameError() || this.rateError() || this.hasAnyGroupError()) {
      return;
    }

    this.submitting.set(true);

    const m = this.taxGroupModel();
    const payload: TaxGroupCU = {
      name: m.name.trim(),
      rate: Number(m.rate),
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      groups: m.groups.map((g) => ({
        mode: g.mode.trim(),
        taxids: [...g.taxids],
      })),
    };

    const currentId = this.id();
    const saved = currentId
      ? await this.taxGroupStore.updateTaxGroup(currentId, payload)
      : await this.taxGroupStore.createTaxGroup(payload);

    this.submitting.set(false);

    if (saved) {
      await this.burlNavigation.navigateBack();
    }
  }

  private patchModelFromTaxGroup(tg: TaxGroup): void {
    this.taxGroupModel.set({
      name: tg.name ?? '',
      rate: String(tg.rate ?? ''),
      description: tg.description ?? '',
      groups: (tg.groups ?? []).map((g) => ({
        mode: g.mode ?? '',
        taxids: [...(g.taxids ?? []), ...(g.taxes ?? [])].filter(Boolean) as string[],
      })),
    });
  }

  private getNumberError(value: string, label: string): string | null {
    if (value.trim().length === 0) {
      return `${label} is required.`;
    }

    const numberValue = Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
      return `${label} must be zero or greater.`;
    }

    return null;
  }
}
