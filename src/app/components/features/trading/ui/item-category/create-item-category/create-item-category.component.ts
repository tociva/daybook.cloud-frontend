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
import { ItemCategoryFacade, ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory, ItemCategoryPayload, ItemType } from '../../../data/item-category';
import { TaxGroupStore } from '../../../data/tax-group';
import type { TaxGroup } from '../../../data/tax-group';

const ITEM_TYPES: ItemType[] = ['Product', 'Service'];

type ItemCategoryFormModel = {
  name: string;
  code: string;
  type: string;
  parentId: string;
  taxgroupId: string;
  description: string;
};

@Component({
  selector: 'app-create-item-category',
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
  templateUrl: './create-item-category.component.html',
  styleUrl: './create-item-category.component.css',
})
export class CreateItemCategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(ItemCategoryFacade);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly typeQuery = signal('');
  protected readonly parentQuery = signal('');
  protected readonly taxGroupQuery = signal('');

  protected readonly categoryModel = signal<ItemCategoryFormModel>({
    name: '',
    code: '',
    type: '',
    parentId: '',
    taxgroupId: '',
    description: '',
  });
  protected readonly categoryForm = form(this.categoryModel);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Category' : 'Create Category',
  );

  // ── Type options ──────────────────────────────────────────────────────────

  protected readonly typeOptions = signal<string[]>(ITEM_TYPES);
  protected readonly typeOptionValue = (t: string): string => t;
  protected readonly typeOptionLabel = (t: string): string => t;
  protected readonly typeTrackBy = (_index: number, t: string): string => t;
  protected readonly filteredTypeOptions = computed(() =>
    this.filterAutocompleteOptions(this.typeOptions(), this.typeOptionLabel, this.typeQuery()),
  );

  // ── Parent category autocomplete helpers ──────────────────────────────────

  protected readonly parentOptionValue = (cat: ItemCategory): string => cat.id ?? '';
  protected readonly parentOptionLabel = (cat: ItemCategory): string => cat.name ?? '';
  protected readonly parentTrackBy = (_index: number, cat: ItemCategory): string => cat.id ?? '';

  // Filter out the current item from parent options (avoids self-reference in edit)
  protected readonly parentOptions = computed(() =>
    this.itemCategoryStore.items().filter((c) => c.id !== this.id()),
  );
  protected readonly filteredParentOptions = computed(() =>
    this.filterAutocompleteOptions(this.parentOptions(), this.parentOptionLabel, this.parentQuery()),
  );

  // ── Tax group autocomplete helpers ────────────────────────────────────────

  protected readonly taxGroupOptionValue = (tg: TaxGroup): string => tg.id ?? '';
  protected readonly taxGroupOptionLabel = (tg: TaxGroup): string => tg.name ?? '';
  protected readonly taxGroupTrackBy = (_index: number, tg: TaxGroup): string => tg.id ?? '';
  protected readonly filteredTaxGroupOptions = computed(() =>
    this.filterAutocompleteOptions(
      this.taxGroupStore.items(),
      this.taxGroupOptionLabel,
      this.taxGroupQuery(),
    ),
  );

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly nameError = computed(() =>
    this.submitted() && this.categoryModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly codeError = computed(() =>
    this.submitted() && this.categoryModel().code.trim() === '' ? 'Code is required.' : null,
  );
  protected readonly typeError = computed(() =>
    this.submitted() && this.categoryModel().type.trim() === '' ? 'Type is required.' : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.categoryModel();
    const identityCompleted =
      m.name.trim().length > 0 && m.code.trim().length > 0 && m.type.trim().length > 0;
    const relationsCompleted = m.parentId.trim().length > 0 || m.taxgroupId.trim().length > 0;
    const notesCompleted = m.description.trim().length > 0;

    return [
      {
        value: 'identity',
        label: 'Identity',
        description: 'Name, code, and type',
        completed: identityCompleted,
      },
      {
        value: 'relations',
        label: 'Relations',
        description: 'Parent category and tax group',
        completed: relationsCompleted,
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

  // ──────────────────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.itemCategoryStore.loadItemCategories({}),
      this.taxGroupStore.loadTaxGroups({}),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.itemCategoryStore.clearSelectedItem();
      return;
    }

    const cat = await this.itemCategoryStore.loadItemCategoryById(id, {
      includes: ['parent', 'taxgroup'],
    });
    if (cat) {
      this.categoryModel.set({
        name: cat.name ?? '',
        code: cat.code ?? '',
        type: cat.type ?? '',
        parentId: cat.parent?.id ?? cat.parentid ?? '',
        taxgroupId: cat.taxgroup?.id ?? cat.taxgroupid ?? '',
        description: cat.description ?? '',
      });
    }
  }

  protected onTypeChange(value: unknown): void {
    const type = typeof value === 'string' ? value : '';
    if (type) {
      this.categoryModel.update((m) => ({ ...m, type }));
    }
  }

  protected onParentChange(value: unknown): void {
    const parentId = typeof value === 'string' ? value : '';
    this.categoryModel.update((m) => ({ ...m, parentId }));
  }

  protected onTaxGroupChange(value: unknown): void {
    const taxgroupId = typeof value === 'string' ? value : '';
    this.categoryModel.update((m) => ({ ...m, taxgroupId }));
  }

  protected onTypeQueryChnage(event: unknown): void {
    this.typeQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onParentQueryChnage(event: unknown): void {
    this.parentQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onTaxGroupQueryChnage(event: unknown): void {
    this.taxGroupQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.codeError() || this.typeError()) {
      return;
    }

    const m = this.categoryModel();
    const payload: ItemCategoryPayload = {
      name: m.name.trim(),
      code: m.code.trim(),
      type: m.type as ItemType,
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      ...(m.parentId ? { parentid: m.parentId } : {}),
      ...(m.taxgroupId ? { taxgroupid: m.taxgroupId } : {}),
    };

    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
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
