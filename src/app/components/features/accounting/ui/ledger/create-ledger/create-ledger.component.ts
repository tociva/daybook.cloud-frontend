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
  templateUrl: './create-ledger.component.html',
  styleUrl: './create-ledger.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateLedgerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(LedgerFacade);
  protected readonly ledgerStore = inject(LedgerStore);
  protected readonly ledgerCategoryStore = inject(LedgerCategoryStore);

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

  // ── Validation ────────────────────────────────────────────────────────────
  protected readonly nameError = computed(() =>
    this.submitted() && this.ledgerModel().name.trim() === '' ? 'Name is required.' : null,
  );
  protected readonly categoryError = computed(() =>
    this.submitted() && this.ledgerModel().categoryId.trim() === ''
      ? 'Category is required.'
      : null,
  );

  async ngOnInit(): Promise<void> {
    await this.ledgerCategoryStore.loadLedgerCategories({});

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (!id) {
      this.ledgerStore.clearSelectedItem();
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
}
