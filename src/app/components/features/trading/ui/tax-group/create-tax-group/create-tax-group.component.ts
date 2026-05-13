import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, afterNextRender, computed, inject, signal } from '@angular/core';
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
  TngHint,
  TngInputComponent,
  TngLabelComponent,
  TngMultiAutocompleteComponent,
  TngStepperComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { TaxStore } from '../../../data/tax';
import type { Tax } from '../../../data/tax';
import { TaxGroupFacade, TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroup, TaxGroupCU } from '../../../data/tax-group';

const TAX_GROUP_MODE_SUGGESTIONS = ['Inter State', 'Intra State', 'EXPORT', 'NON-TAXABLE'] as const;

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
    TngError,
    TngFormFieldComponent,
    TngHint,
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
export class CreateTaxGroupComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly document = inject(DOCUMENT);
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(TaxGroupFacade);
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
      m.groups.length > 0 && m.groups.every((g) => g.mode.trim().length > 0 && g.taxids.length > 0);

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

  /**
   * Cache of Tax objects for already-selected IDs.
   * Prevents chips from falling back to showing the raw ID when a search
   * query replaces taxStore.items() with filtered results that no longer
   * contain the selected taxes.
   */
  private readonly taxCache = signal<readonly Tax[]>([]);

  /**
   * The options list passed to tng-multi-autocomplete.
   * Always includes the cached selected taxes so chip labels resolve correctly
   * regardless of what the current search query returns.
   */
  protected readonly taxOptions = computed(() => {
    const items = this.taxStore.items();
    const cached = this.taxCache();
    if (cached.length === 0) return items;
    const liveIds = new Set(items.map((t) => t.id));
    const extra = cached.filter((t) => t.id && !liveIds.has(t.id));
    return extra.length ? [...extra, ...items] : items;
  });

  // ──────────────────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    // Read routeId synchronously first so we can decide the tax load strategy.
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id.set(routeId);

    if (!routeId) {
      // Create mode: a small first page is enough for the initial dropdown.
      await this.taxStore.loadTaxes({});
      this.taxGroupStore.clearSelectedItem();
      return;
    }

    // Edit mode: load taxes with a large limit so every selected tax is present
    // in taxStore.items() when we seed the taxCache below.  The default page
    // size is only 10, which may not cover all the taxes used in this group.
    await this.taxStore.loadTaxes({ limit: 500 });

    const taxGroup = await this.taxGroupStore.loadTaxGroupById(routeId);
    if (taxGroup) {
      this.patchModelFromTaxGroup(taxGroup);
      // Seed the cache so chips show names even after a search query narrows
      // taxStore.items() back down to a filtered page.
      const selectedIds = new Set(
        (taxGroup.groups ?? []).flatMap((g) => [...(g.taxids ?? []), ...(g.taxes ?? [])]),
      );
      this.taxCache.set(this.taxStore.items().filter((t) => t.id && selectedIds.has(t.id)));
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
    // Keep the cache up to date so chip labels survive subsequent search queries.
    const selected = this.taxStore.items().filter((t) => t.id && ids.includes(t.id));
    this.taxCache.update((cache) => {
      const cacheIds = new Set(cache.map((t) => t.id));
      const incoming = selected.filter((t) => !cacheIds.has(t.id));
      // Also prune IDs that are no longer selected across any group.
      const allSelectedIds = new Set([
        ...this.taxGroupModel().groups.flatMap((g) => g.taxids),
        ...ids,
      ]);
      const pruned = cache.filter((t) => t.id && allSelectedIds.has(t.id));
      return incoming.length ? [...pruned, ...incoming] : pruned;
    });

    this.taxGroupModel.update((m) => ({
      ...m,
      groups: m.groups.map((row, ri) => (ri !== groupIndex ? row : { ...row, taxids: [...ids] })),
    }));
  }

  protected onTaxSearch(value: unknown): void {
    const q =
      typeof value === 'string'
        ? value.trim()
        : value instanceof Event
          ? ((value.target as HTMLInputElement | null)?.value ?? '').trim()
          : '';
    void this.taxStore.loadTaxes(
      q
        ? {
            where: {
              name: { ilike: `%${q}%` },
            },
          }
        : {},
    );
  }

  protected addGroup(): void {
    this.taxGroupModel.update((m) => ({
      ...m,
      groups: [...m.groups, { mode: '', taxids: [] }],
    }));

    const newIndex = this.taxGroupModel().groups.length - 1;
    afterNextRender(() => {
      const inputEl = this.document.getElementById(`tax-group-mode-${newIndex}`);
      inputEl?.focus();
    });
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
    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }

    this.submitting.set(false);
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
