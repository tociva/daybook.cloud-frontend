import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
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
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory } from '../../../data/item-category';
import { ItemFacade, ItemStore } from '../../../data/item';
import type { Item, ItemPayload } from '../../../data/item';

/** Sentinel id used to represent the "Create new category" action inside the options list. */
const CREATE_CATEGORY_SENTINEL_ID = '__create_category__';

/** A fake ItemCategory object that acts as the "create" action option. */
const CREATE_CATEGORY_SENTINEL: ItemCategory = {
  id: CREATE_CATEGORY_SENTINEL_ID,
  name: 'No categories found — create one',
} as ItemCategory;

type ItemFormModel = {
  name: string;
  code: string;
  displayname: string;
  categoryId: string;
  barcode: string;
  description: string;
  purchaseledger: string;
  salesledger: string;
};

@Component({
  selector: 'app-create-item',
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
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-item.component.html',
  styleUrl: './create-item.component.css',
})
export class CreateItemComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly facade = inject(ItemFacade);
  protected readonly itemStore = inject(ItemStore);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);
  protected readonly categoryQuery = signal('');

  protected readonly itemModel = signal<ItemFormModel>({
    name: '',
    code: '',
    displayname: '',
    categoryId: '',
    barcode: '',
    description: '',
    purchaseledger: '',
    salesledger: '',
  });
  protected readonly itemForm = form(this.itemModel);

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() => (this.mode() === 'edit' ? 'Edit Item' : 'Create Item'));

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly nameError = computed(() =>
    this.submitted() && this.itemModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly codeError = computed(() =>
    this.submitted() && this.itemModel().code.trim() === '' ? 'Code is required.' : null,
  );
  protected readonly displaynameError = computed(() =>
    this.submitted() && this.itemModel().displayname.trim() === ''
      ? 'Display name is required.'
      : null,
  );
  protected readonly categoryError = computed(() =>
    this.submitted() && this.itemModel().categoryId.trim() === '' ? 'Category is required.' : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.itemModel();
    const identityCompleted =
      m.name.trim().length > 0 && m.code.trim().length > 0 && m.displayname.trim().length > 0;
    const categoryCompleted = m.categoryId.trim().length > 0;
    const detailsCompleted =
      m.barcode.trim().length > 0 ||
      m.description.trim().length > 0 ||
      m.purchaseledger.trim().length > 0 ||
      m.salesledger.trim().length > 0;

    return [
      {
        value: 'identity',
        label: 'Identity',
        description: 'Name, code, and display name',
        completed: identityCompleted,
      },
      {
        value: 'category',
        label: 'Category',
        description: 'Assigned item category',
        completed: categoryCompleted,
      },
      {
        value: 'details',
        label: 'Details',
        description: 'Barcode, ledgers, and notes',
        completed: detailsCompleted,
      },
    ] as const;
  });

  protected readonly activeSetupStep = computed(() => {
    const firstPending = this.setupSteps().find((step) => !step.completed);
    return firstPending?.value ?? 'details';
  });

  // ── Category autocomplete helpers ─────────────────────────────────────────

  protected readonly categoryOptionValue = (cat: ItemCategory): string => cat.id ?? '';
  protected readonly categoryOptionLabel = (cat: ItemCategory): string => cat.name ?? '';
  protected readonly categoryTrackBy = (_index: number, cat: ItemCategory): string => cat.id ?? '';

  /** Expose sentinel id so the template can detect the create-action row. */
  protected readonly createCategorySentinelId = CREATE_CATEGORY_SENTINEL_ID;

  protected readonly filteredCategories = computed(() =>
    this.filterAutocompleteOptions(
      this.itemCategoryStore.items(),
      this.categoryOptionLabel,
      this.categoryQuery(),
    ),
  );

  /**
   * Options list passed to the autocomplete.
   * When the filtered list is empty, append the sentinel "create" option so
   * there is always something actionable to show.
   */
  protected readonly filteredCategoriesWithCreate = computed(() => {
    const categories = this.filteredCategories();
    if (categories.length === 0) {
      return [CREATE_CATEGORY_SENTINEL];
    }
    return categories;
  });

  // ──────────────────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    // Pre-load categories for the autocomplete
    await this.itemCategoryStore.loadItemCategories({});

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.itemStore.clearSelectedItem();
      const draft = this.itemStore.createDraft();
      this.itemStore.clearCreateDraft();
      if (draft) {
        // If a new category was just created on the category page, its id is
        // sitting in itemCategoryStore.selectedItem(). Prefer it over whatever
        // categoryId the draft had before the user navigated away.
        const newCategory = this.itemCategoryStore.selectedItem();
        this.itemCategoryStore.clearSelectedItem();
        this.itemModel.set({
          name: draft.name ?? '',
          code: draft.code ?? '',
          displayname: draft.displayname ?? '',
          categoryId: newCategory?.id ?? draft.category?.id ?? draft.categoryid ?? '',
          barcode: draft.barcode ?? '',
          description: draft.description ?? '',
          purchaseledger: draft.purchaseledger ?? '',
          salesledger: draft.salesledger ?? '',
        });
      }
      return;
    }

    // Instant pre-fill from cache; skip API call if data is already available.
    const cached = this.itemStore.selectedItem();
    if (cached?.id === id) {
      this.itemModel.set({
        name: cached.name ?? '',
        code: cached.code ?? '',
        displayname: cached.displayname ?? '',
        categoryId: cached.category?.id ?? cached.categoryid ?? '',
        barcode: cached.barcode ?? '',
        description: cached.description ?? '',
        purchaseledger: cached.purchaseledger ?? '',
        salesledger: cached.salesledger ?? '',
      });
      return;
    }

    const item = await this.itemStore.loadItemById(id, { includes: ['category'] });
    if (item) {
      this.itemModel.set({
        name: item.name ?? '',
        code: item.code ?? '',
        displayname: item.displayname ?? '',
        categoryId: item.category?.id ?? item.categoryid ?? '',
        barcode: item.barcode ?? '',
        description: item.description ?? '',
        purchaseledger: item.purchaseledger ?? '',
        salesledger: item.salesledger ?? '',
      });
    }
  }

  protected onCategoryChange(value: unknown): void {
    const categoryId = typeof value === 'string' ? value : '';
    if (!categoryId) return;

    // Intercept the sentinel — treat as "navigate to create category".
    if (categoryId === CREATE_CATEGORY_SENTINEL_ID) {
      this.createNewCategory();
      return;
    }

    // Auto-fill code from the selected category if code field is empty
    const category = this.itemCategoryStore.items().find((c) => c.id === categoryId);
    this.itemModel.update((m) => ({
      ...m,
      categoryId,
      code: m.code.trim() === '' && category?.code ? category.code : m.code,
    }));
  }

  protected onCategoryQueryChange(event: unknown): void {
    this.categoryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected createNewCategory(): void {
    const m = this.itemModel();
    // Clear any stale category selectedItem so we can distinguish "user just
    // created a category" (selectedItem will be set by createItemCategory())
    // from "user cancelled without creating" (selectedItem stays null).
    this.itemCategoryStore.clearSelectedItem();
    this.itemStore.setCreateDraft({
      name: m.name,
      code: m.code,
      displayname: m.displayname,
      categoryid: m.categoryId,
      ...(m.barcode ? { barcode: m.barcode } : {}),
      ...(m.description ? { description: m.description } : {}),
      ...(m.purchaseledger ? { purchaseledger: m.purchaseledger } : {}),
      ...(m.salesledger ? { salesledger: m.salesledger } : {}),
    });
    void this.router.navigate(['/app/trading/item-category/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);

    if (this.nameError() || this.codeError() || this.displaynameError() || this.categoryError()) {
      return;
    }

    const m = this.itemModel();
    const payload: ItemPayload = {
      name: m.name.trim(),
      code: m.code.trim(),
      displayname: m.displayname.trim(),
      categoryid: m.categoryId,
      ...(m.barcode.trim() ? { barcode: m.barcode.trim() } : {}),
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      ...(m.purchaseledger.trim() ? { purchaseledger: m.purchaseledger.trim() } : {}),
      ...(m.salesledger.trim() ? { salesledger: m.salesledger.trim() } : {}),
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
