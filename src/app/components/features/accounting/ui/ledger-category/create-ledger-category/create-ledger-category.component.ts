import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import {
  LEDGER_CATEGORY_TYPES,
  LedgerCategoryFacade,
  LedgerCategoryStore,
} from '../../../data/ledger-category';
import type {
  LedgerCategory,
  LedgerCategoryPayload,
  LedgerCategoryType,
} from '../../../data/ledger-category';

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
  templateUrl: './create-ledger-category.component.html',
  styleUrl: './create-ledger-category.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLedgerCategoryComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerCategoryFacade);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);

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
  protected readonly typeOptions = signal<readonly string[]>(LEDGER_CATEGORY_TYPES);
  protected readonly typeOptionValue = (t: string): string => t;
  protected readonly typeOptionLabel = (t: string): string => t;
  protected readonly typeTrackBy = (_i: number, t: string): string => t;

  // ── Parent category autocomplete ──────────────────────────────────────────
  protected readonly parentOptions = computed(() =>
    this.ledgerCategoryStore.items().filter((c) => c.id !== this.id()),
  );
  protected readonly parentOptionValue = (cat: LedgerCategory): string => cat.id ?? '';
  protected readonly parentOptionLabel = (cat: LedgerCategory): string => cat.name ?? '';
  protected readonly parentTrackBy = (_i: number, cat: LedgerCategory): string => cat.id ?? '';

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.categoryModel().name.trim() === '' ? 'Name is required.' : null,
  );

  async ngOnInit(): Promise<void> {
    await this.ledgerCategoryStore.loadLedgerCategories({});

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
      this.categoryModel.set({
        name: cat.name ?? '',
        type: cat.props?.type ?? '',
        parentId: cat.parent?.id ?? cat.parentid ?? '',
        description: cat.description ?? '',
      });
    }
  }

  protected onTypeChange(value: unknown): void {
    const type = typeof value === 'string' ? value : '';
    this.categoryModel.update((m) => ({ ...m, type }));
  }

  protected onParentChange(value: unknown): void {
    const parentId = typeof value === 'string' ? value : '';
    this.categoryModel.update((m) => ({ ...m, parentId }));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (this.nameError()) return;

    const m = this.categoryModel();
    const payload: LedgerCategoryPayload = {
      name: m.name.trim(),
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      ...(m.parentId ? { parentid: m.parentId } : {}),
      ...(m.type
        ? { props: { type: m.type as LedgerCategoryType } }
        : {}),
    };

    const currentId = this.id();
    if (currentId) {
      await this.facade.update(currentId, payload);
    } else {
      await this.facade.create(payload);
    }
  }
}
