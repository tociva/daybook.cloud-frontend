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
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import { ItemCategoryStore } from '../../../data/item-category';
import type { ItemCategory } from '../../../data/item-category';
import { ItemStore } from '../../../data/item';
import type { ItemPayload } from '../../../data/item';

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
  templateUrl: './create-item.component.html',
  styleUrl: './create-item.component.css',
})
export class CreateItemComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);
  protected readonly itemStore = inject(ItemStore);
  protected readonly itemCategoryStore = inject(ItemCategoryStore);

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
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Item' : 'Create Item',
  );

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
    this.submitted() && this.itemModel().categoryId.trim() === ''
      ? 'Category is required.'
      : null,
  );

  // ── Stepper ───────────────────────────────────────────────────────────────

  protected readonly setupSteps = computed(() => {
    const m = this.itemModel();
    const identityCompleted =
      m.name.trim().length > 0 &&
      m.code.trim().length > 0 &&
      m.displayname.trim().length > 0;
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
  protected readonly categoryTrackBy = (_index: number, cat: ItemCategory): string =>
    cat.id ?? '';

  // ──────────────────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    // Pre-load categories for the autocomplete
    await this.itemCategoryStore.loadItemCategories({});

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.itemStore.clearSelectedItem();
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

    // Auto-fill code from the selected category if code field is empty
    const category = this.itemCategoryStore.items().find((c) => c.id === categoryId);
    this.itemModel.update((m) => ({
      ...m,
      categoryId,
      code: m.code.trim() === '' && category?.code ? category.code : m.code,
    }));
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
    const saved = id
      ? await this.itemStore.updateItem(id, payload)
      : await this.itemStore.createItem(payload);

    if (saved) {
      await this.burlNavigation.navigateBack();
    }
  }
}
