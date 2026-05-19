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
  TngTextareaComponent,
} from '@tailng-ui/components';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { LedgerCategoryStore } from '../../../data/ledger-category';
import type { LedgerCategory } from '../../../data/ledger-category';
import { LedgerFacade, LedgerStore } from '../../../data/ledger';
import type { LedgerPayload } from '../../../data/ledger';

type LedgerFormModel = {
  name: string;
  categoryId: string;
  openingdr: string;
  openingcr: string;
  description: string;
};

@Component({
  selector: 'app-create-ledger',
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
    TngTextareaComponent,
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
  ],
  templateUrl: './create-ledger.component.html',
  styleUrl: './create-ledger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLedgerComponent implements AfterViewInit {
  @ViewChild('nameInputRef', { read: ElementRef }) private nameInputRef!: ElementRef;
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerFacade);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);
  protected readonly categoryQuery = signal('');

  protected readonly id = signal<string | null>(null);
  protected readonly submitted = signal(false);

  protected readonly ledgerModel = signal<LedgerFormModel>({
    name: '',
    categoryId: '',
    openingdr: '',
    openingcr: '',
    description: '',
  });
  protected readonly ledgerForm = form(this.ledgerModel);

  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Ledger' : 'New Ledger',
  );

  // ── Category autocomplete ─────────────────────────────────────────────────
  protected readonly categoryOptionValue = (cat: LedgerCategory): string => cat.id ?? '';
  protected readonly categoryOptionLabel = (cat: LedgerCategory): string => cat.name ?? '';
  protected readonly categoryTrackBy = (_i: number, cat: LedgerCategory): string => cat.id ?? '';
  protected readonly filteredCategories = computed(() =>
    this.filterAutocompleteOptions(
      this.ledgerCategoryStore.items(),
      this.categoryOptionLabel,
      this.categoryQuery(),
    ),
  );

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.ledgerModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly categoryError = computed(() =>
    this.submitted() && this.ledgerModel().categoryId.trim() === ''
      ? 'Category is required.'
      : null,
  );

  constructor() {
    void this.loadInitialState();
  }

  ngAfterViewInit(): void {
    this.nameInputRef?.nativeElement.querySelector('input')?.focus();
  }

  private async loadInitialState(): Promise<void> {
    this.ledgerStore.clearError();

    await this.ledgerCategoryStore.loadLedgerCategories({});

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.ledgerStore.clearSelectedItem();
      return;
    }

    // Instant pre-fill from cache; categoryId resolves via already-loaded ledgerCategoryStore.items().
    const cached = this.ledgerStore.selectedItem();
    if (cached?.id === id) {
      this.ledgerModel.set({
        name: cached.name ?? '',
        categoryId: cached.category?.id ?? cached.categoryid ?? '',
        openingdr: cached.openingdr != null ? String(cached.openingdr) : '',
        openingcr: cached.openingcr != null ? String(cached.openingcr) : '',
        description: cached.description ?? '',
      });
      return;
    }

    const ledger = await this.ledgerStore.loadLedgerById(id, { includes: ['category'] });
    if (ledger) {
      this.ledgerModel.set({
        name: ledger.name ?? '',
        categoryId: ledger.category?.id ?? ledger.categoryid ?? '',
        openingdr: ledger.openingdr != null ? String(ledger.openingdr) : '',
        openingcr: ledger.openingcr != null ? String(ledger.openingcr) : '',
        description: ledger.description ?? '',
      });
    }
  }

  protected onCategoryChange(value: unknown): void {
    const categoryId = typeof value === 'string' ? value : '';
    this.ledgerModel.update((m) => ({ ...m, categoryId }));
  }

  protected onCategoryQueryChange(event: unknown): void {
    this.categoryQuery.set(this.normalizeAutocompleteQuery(event));
  }

  protected async submitForm(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (this.nameError() || this.categoryError()) return;

    const m = this.ledgerModel();
    const openingdr = m.openingdr.trim() ? parseFloat(m.openingdr) : undefined;
    const openingcr = m.openingcr.trim() ? parseFloat(m.openingcr) : undefined;

    const payload: LedgerPayload = {
      name: m.name.trim(),
      categoryid: m.categoryId,
      ...(m.description.trim() ? { description: m.description.trim() } : {}),
      ...(openingdr != null && !isNaN(openingdr) ? { openingdr } : {}),
      ...(openingcr != null && !isNaN(openingcr) ? { openingcr } : {}),
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
