import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute } from '@angular/router';
import {
  TngAutocompleteComponent,
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
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import {
  findLedgerCategoryById,
  getLedgerCategoryTypeOptions,
  isLedgerCategoryTypeFieldEditable,
  LedgerCategoryFacade,
  LedgerCategoryStore,
  normalizeTypeAfterParentChange,
  validateLedgerCategoryClassification,
} from '../../../data/ledger-category';
import type {
  LedgerCategory,
  LedgerCategoryPayload,
  LedgerCategoryType,
} from '../../../data/ledger-category';
import { DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS } from '../../../../../../util/constants';

type LedgerCategoryFormModel = {
  name: string;
  type: string;
  parentId: string;
  description: string;
};

@Component({
  selector: 'app-create-ledger-category',
  standalone: true,
  imports: [
    FormField,
    TngAutocompleteComponent,
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
    TngIcon,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-ledger-category.component.html',
  styleUrl: './create-ledger-category.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLedgerCategoryComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerCategoryFacade);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  protected readonly typeQuery = signal('');
  protected readonly parentQuery = signal('');
  private parentSearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly categoryModel = signal<LedgerCategoryFormModel>({
    name: '',
    type: '',
    parentId: '',
    description: '',
  });
  protected readonly categoryForm = form(this.categoryModel);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Ledger Category' : 'New Ledger Category',
  );

  // ── Type autocomplete ─────────────────────────────────────────────────────
  protected readonly typeOptionValue = (t: string): string => t;
  protected readonly typeOptionLabel = (t: string): string => t;
  protected readonly typeTrackBy = (_i: number, t: string): string => t;
  protected readonly selectedParentCategory = computed(() =>
    findLedgerCategoryById(
      this.ledgerCategoryStore.catalog(),
      this.categoryModel().parentId.trim(),
    ),
  );
  protected readonly typeOptions = computed(() =>
    getLedgerCategoryTypeOptions(
      this.categoryModel().parentId,
      this.selectedParentCategory(),
    ),
  );
  protected readonly filteredTypeOptions = computed(() =>
    this.filterAutocompleteOptions(this.typeOptions(), this.typeOptionLabel, this.typeQuery()),
  );

  // ── Parent category autocomplete ──────────────────────────────────────────
  protected readonly parentOptions = computed(() =>
    this.ledgerCategoryStore.catalog().filter((c) => c.id !== this.id()),
  );
  protected readonly filteredParentOptions = computed(() =>
    this.filterAutocompleteOptions(
      this.parentOptions(),
      this.parentOptionLabel,
      this.parentQuery(),
    ),
  );
  protected readonly parentOptionValue = (cat: LedgerCategory): string => cat.id ?? '';
  protected readonly parentOptionLabel = (cat: LedgerCategory): string => cat.name ?? '';
  protected readonly parentTrackBy = (_i: number, cat: LedgerCategory): string => cat.id ?? '';

  protected readonly parentClearDisabled = computed(
    () => this.categoryModel().parentId.trim() === '',
  );

  protected readonly typeFieldDisabled = computed(
    () =>
      !isLedgerCategoryTypeFieldEditable(
        this.categoryModel().parentId,
        this.selectedParentCategory(),
      ),
  );

  protected readonly typeAutocompletePlaceholder = computed(() => {
    const parentId = this.categoryModel().parentId.trim();
    if (!parentId) return 'Select a root type';
    return this.typeFieldDisabled()
      ? 'Type is inherited from parent'
      : 'Optional Capital child type';
  });

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.categoryModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly classificationError = computed(() =>
    this.submitted()
      ? validateLedgerCategoryClassification({
          parent: this.selectedParentCategory(),
          parentId: this.categoryModel().parentId,
          type: this.categoryModel().type,
          typeFieldEditable: !this.typeFieldDisabled(),
        })
      : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.categoryModel();
    const nameCompleted = m.name.trim().length > 0;
    const classificationCompleted = m.type.trim().length > 0 || m.parentId.trim().length > 0;
    const notesCompleted = m.description.trim().length > 0;

    return [
      {
        value: 'name',
        label: 'Name',
        description: 'How the category appears in lists',
        completed: nameCompleted,
      },
      {
        value: 'classification',
        label: 'Type & hierarchy',
        description: 'Root type or parent category (one at a time)',
        completed: classificationCompleted,
      },
      {
        value: 'notes',
        label: 'Notes',
        description: 'Optional internal description',
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
    this.ledgerCategoryStore.clearError();

    await this.ledgerCategoryStore.ensureLedgerCategoryCatalogLoaded();

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.ledgerCategoryStore.clearSelectedItem();
      return;
    }

    const cat = await this.ledgerCategoryStore.loadLedgerCategoryById(id, {
      includes: ['parent'],
    });
    if (cat) {
      const parentId = cat.parent?.id ?? cat.parentid ?? '';
      this.categoryModel.set({
        name: cat.name ?? '',
        type: cat.props?.type ?? '',
        parentId,
        description: cat.description ?? '',
      });
    }
  }

  protected onTypeChange(value: unknown): void {
    if (this.typeFieldDisabled()) return;
    const type = typeof value === 'string' ? value : '';
    this.categoryModel.update((m) => ({ ...m, type }));
  }

  protected onParentChange(value: unknown): void {
    const parentId =
      value == null || value === '' ? '' : typeof value === 'string' ? value : String(value);
    const previous = this.categoryModel();
    const nextParent = findLedgerCategoryById(this.ledgerCategoryStore.catalog(), parentId.trim());
    const hasParent = parentId.trim() !== '';
    this.categoryModel.update((m) => ({
      ...m,
      parentId,
      type: normalizeTypeAfterParentChange(
        previous.type,
        previous.parentId,
        parentId,
        nextParent,
      ),
    }));
    if (hasParent) {
      this.typeQuery.set('');
    }
  }

  protected clearParent(): void {
    this.parentQuery.set('');
    this.categoryModel.update((m) => ({
      ...m,
      parentId: '',
      type: normalizeTypeAfterParentChange(m.type, m.parentId, '', null),
    }));
  }

  protected onTypeQueryChange(event: unknown): void {
    this.typeQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected onParentQueryChange(event: unknown): void {
    const q = this.normalizeAutocompleteQuery(event);
    this.parentQuery.set(q);
    if (this.parentSearchTimer) clearTimeout(this.parentSearchTimer);
    this.parentSearchTimer = setTimeout(() => {
      void this.ledgerCategoryStore.loadLedgerCategories(
        q
          ? {
              where: { name: { ilike: `%${q}%` } },
            }
          : {},
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (this.nameError() || this.classificationError()) return;

    const m = this.categoryModel();
    const parentid = m.parentId.trim() === '' ? null : m.parentId.trim();
    const payload: LedgerCategoryPayload = {
      name: m.name.trim(),
      parentid,
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      ...(m.type ? { props: { type: m.type as LedgerCategoryType } } : {}),
    };

    const currentId = this.id();
    if (currentId) {
      await this.facade.update(currentId, payload);
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
