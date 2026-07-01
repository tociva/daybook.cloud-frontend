import { Component, ElementRef, computed, inject, input, output } from '@angular/core';
import { form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngButtonComponent,
  TngInputComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { Item } from '../../../../data/item';
import { ItemStore } from '../../../../data/item';
import type { StoredDocument } from '../../../../data/invoice-document';
import { InvoiceGrandTotalDisplayComponent } from '../../../../../../../shared/invoice-grand-total-display/invoice-grand-total-display.component';
import { InvoiceDocumentTagsComponent } from '../../../shared/invoice-document-tags/invoice-document-tags.component';
import { SaleInvoiceDraftStore, type ItemRow } from '../sale-invoice-draft.store';
import { PERMISSION } from '../../../../../../../core/permissions/permission-requirements';
import { PermissionsStore } from '../../../../../../../core/permissions/permissions.store';

/** Sentinel id used to represent the "Create new item" action inside the options list. */
const CREATE_ITEM_SENTINEL_ID = '__create_item__';

/** A fake Item object that acts as the "create" action option. */
const CREATE_ITEM_SENTINEL: Item = {
  id: CREATE_ITEM_SENTINEL_ID,
  name: 'No items found — create one',
} as Item;

const INTERACTIVE_CLICK_TARGET_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Component({
  selector: 'app-si-line-items',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngButtonComponent,
    TngInputComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    TngIcon,
    InvoiceGrandTotalDisplayComponent,
    InvoiceDocumentTagsComponent,
  ],
  templateUrl: './si-line-items.component.html',
  styleUrl: './si-line-items.component.css',
})
export class SiLineItemsComponent {
  protected readonly draft        = inject(SaleInvoiceDraftStore);
  private  readonly itemStore     = inject(ItemStore);
  private  readonly router        = inject(Router);
  private readonly permissions    = inject(PermissionsStore);
  readonly readOnly = input(false);
  readonly documentFiles = input<readonly File[]>([]);
  readonly documents = input<readonly StoredDocument[]>([]);
  readonly documentParentId = input<string | null>(null);
  readonly documentsDisabled = input(false);
  readonly documentsUploading = input(false);
  readonly documentFilesChange = output<readonly File[]>();
  readonly documentRemove = output<StoredDocument>();
  protected readonly lineItemsForm = form(this.draft.items);
  protected readonly rowCount = computed(() => this.lineItemsForm().value().length);
  protected readonly itemOptionValue = (item: Item): string => item.id ?? '';
  protected readonly itemOptionLabel = (item: Item): string => item.name ?? item.displayname ?? '';
  protected readonly itemCategoryName = (item: Item): string => item.category?.name ?? '';
  protected readonly itemTrackBy = (_index: number, item: Item): unknown => item.id ?? item.name;
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Expose sentinel id so the template can detect the create-action row. */
  protected readonly createItemSentinelId = CREATE_ITEM_SENTINEL_ID;
  protected readonly canCreateItem = computed(() =>
    this.permissions.can(PERMISSION.branch.item.create),
  );

  // ── Tax column visibility (derived from draft tax option) ──────────────
  // Intra State → CGST + SGST; Inter State → IGST only; Export / Non Taxable → none
  readonly showIntraStateTax = computed(() => this.draft.taxoption() === 'Intra State');
  readonly showIGST          = computed(() => this.draft.taxoption() === 'Inter State');

  // ── Quantity column selection ──────────────────────────────────────────
  // Quantity 1 (rowspan=2, no sub-row) is shown only when there is nothing
  // else in the second header/body row — i.e. discount AND tax are both off.
  // In all other cases, Quantity 2 (with Item Total sub-row) is shown.
  readonly showQty1 = computed(
    () => !this.draft.showDiscount() && !this.showIntraStateTax() && !this.showIGST(),
  );
  readonly rowSpan = computed(() => (this.showQty1() ? 1 : 2));

  protected onItemValueChange(value: unknown, rowIndex: number): void {
    const itemId = typeof value === 'string' ? value : '';
    if (!itemId) return;

    // Intercept the sentinel — save draft and navigate to item create.
    if (itemId === CREATE_ITEM_SENTINEL_ID) {
      this.createNewItem(rowIndex);
      return;
    }

    const item = this.itemOptionsForRow(this.draft.items()[rowIndex]).find(
      (currentItem) => currentItem.id === itemId,
    );
    if (item) {
      void this.draft.selectItem(item, rowIndex);
      this.focusPriceInputAfterSelection(rowIndex);
    }
  }

  protected itemOptionsForRow(row: ItemRow): readonly Item[] {
    const options = this.draft.filteredItems();
    if (!row.item || options.some((item) => item.id === row.itemid)) {
      return options;
    }

    return [row.item, ...options];
  }

  /**
   * Options list for a row passed to the autocomplete.
   * Appends the sentinel "create" option when nothing matches the current search.
   */
  protected itemOptionsForRowWithCreate(row: ItemRow): readonly Item[] {
    const options = this.itemOptionsForRow(row);
    if (options.length === 0 && this.canCreateItem()) {
      return [CREATE_ITEM_SENTINEL];
    }
    return options;
  }

  protected createNewItem(rowIndex: number): void {
    if (!this.canCreateItem()) return;

    // Clear stale selectedItem so we can distinguish "just created" vs "cancelled" on return.
    this.itemStore.clearSelectedItem();
    // Save full draft state + the row index to restore on return.
    this.draft.saveDraft(rowIndex);
    void this.router.navigate(['/app/trading/item/create'], {
      queryParams: { burl: this.router.url },
    });
  }

  protected onItemAutocompleteFocusin(rowIndex: number): void {
    // `queryChange` is a model signal and only fires when the query *changes*.
    // On first focus of a blank row the query is already '' so no event fires and
    // the item dropdown opens empty.  Proactively calling onItemSearchInput('', …)
    // seeds the list with all items and sets the active row, guaranteeing the
    // dropdown is populated as soon as the field receives focus.
    this.draft.onItemSearchInput('', rowIndex);
  }

  protected focusNameAutocomplete(event: MouseEvent): void {
    this.focusTableControl(event, '[data-slot="autocomplete-trigger"]');
  }

  protected focusTableInput(event: MouseEvent): void {
    this.focusTableControl(event, '[data-slot="input"]');
  }

  protected focusTableTextarea(event: MouseEvent): void {
    this.focusTableControl(event, 'textarea');
  }

  protected normalizeRoundoffOnBlur(): void {
    this.draft.roundoff.set(this.normalizeRoundoffValue(this.draft.roundoff()));
  }

  protected onRoundoffChange(value: string | null): void {
    this.draft.roundoff.set(this.normalizeRoundoffValue(value ?? ''));
  }

  private focusTableControl(event: MouseEvent, selector: string): void {
    if (event.defaultPrevented) return;

    const target = event.target;
    const currentTarget = event.currentTarget;
    if (!(target instanceof Element) || !(currentTarget instanceof HTMLElement)) return;

    const interactiveTarget = target.closest(INTERACTIVE_CLICK_TARGET_SELECTOR);
    if (interactiveTarget !== null && currentTarget.contains(interactiveTarget)) return;

    currentTarget.querySelector<HTMLElement>(selector)?.focus();
  }

  private normalizeRoundoffValue(value: string): string {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed === '-' || trimmed === '.' || trimmed === '-.') return '0';

    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? String(numericValue) : '0';
  }

  focusPriceInput(rowIndex: number): void {
    globalThis.setTimeout(() => {
      const priceInput = this.hostElement.nativeElement.querySelector<HTMLInputElement>(
        `.si-li-col-price[data-row-index="${rowIndex}"] [data-slot="input"]`,
      );
      priceInput?.focus();
      priceInput?.select();
    });
  }

  focusItemAutocomplete(rowIndex: number): void {
    globalThis.setTimeout(() => {
      const trigger = this.hostElement.nativeElement.querySelector<HTMLElement>(
        `.si-li-col-name[data-row-index="${rowIndex}"] [data-slot="autocomplete-trigger"]`,
      );
      trigger?.focus();
    });
  }

  private focusPriceInputAfterSelection(rowIndex: number): void {
    this.focusPriceInput(rowIndex);
  }

  // ── Width freed by hidden tax columns ──────────────────────────────────
  // Each tax group occupies label(3%) + pct/amt(5%) = 8% of table width.
  // Intra State shows CGST+SGST (16%), frees IGST (8%).
  // Inter State shows IGST (8%), frees CGST+SGST (16%).
  // Export / Non Taxable shows nothing, frees all three (24%).
  private readonly taxFreeWidth = computed<number>(() => {
    const opt = this.draft.taxoption();
    if (opt === 'Intra State') return 8;   // IGST hidden
    if (opt === 'Inter State') return 16;  // CGST + SGST hidden
    return 24;                             // all tax columns hidden
  });

  // ── Computed column classes with dynamic widths ────────────────────────
  // Exactly one quantity column (w-8) is visible at a time (Qty1 or Qty2),
  // so the total qty budget is always 8%.
  //
  // Base widths (tf=0, all 3 tax cols visible — never actually reached):
  //   disc=ON,  desc=ON  → name=15, desc=16
  //   disc=ON,  desc=OFF → name=31
  //   disc=OFF, desc=ON  → name=22, desc=24
  //   disc=OFF, desc=OFF → name=46
  //
  // Freed tax space (taxFreeWidth) is split across visible text columns
  // (name, display name, description). When only name is visible it receives
  // the full text-column budget.
  // disc freed: disc-label(3%) + disc-pct(5%) + taxable(7%) = 15%
  private readonly textColumnBudget = computed(() => {
    const tf = this.taxFreeWidth();
    return (this.draft.showDiscount() ? 31 : 46) + tf;
  });

  private readonly textColumnCount = computed(() => {
    let count = 1;
    if (this.draft.showDisplayName()) count += 1;
    if (this.draft.showDescription()) count += 1;
    return count;
  });

  private readonly textColumnWidth = computed(() => this.textColumnBudget() / this.textColumnCount());

  nameColClass = computed(() => {
    return 'si-li-col-name px-4 text-left';
  });

  displayNameColClass = computed(() => {
    return 'si-li-col-display-name px-4 text-left';
  });

  descColClass = computed(() => {
    return 'si-li-col-description px-4 text-left';
  });

  nameColWidth = computed(() => this.textColumnWidth());
  displayNameColWidth = computed(() => this.textColumnWidth());
  descColWidth = computed(() => this.textColumnWidth());

  protected formatAmount(value: number | undefined | null): string {
    return value === undefined || value === null ? '—' : value.toFixed(2);
  }

  // ── Currency symbol (kept here for the summary-table column) ──────────────
  readonly currencySymbol = computed(() => {
    const code = this.draft.currencycode() || 'INR';
    const symbols: Record<string, string> = {
      AED: 'د.إ', AUD: 'A$',  BDT: '৳',   CAD: 'C$',  CHF: 'Fr',
      CNY: '¥',   EUR: '€',   GBP: '£',   INR: '₹',   JPY: '¥',
      LKR: 'Rs',  MYR: 'RM',  NPR: '₨',   NZD: 'NZ$', OMR: 'ر.ع.',
      PKR: '₨',   QAR: 'ر.ق', SAR: 'ر.س', SGD: 'S$',  USD: '$',
    };
    return symbols[code] ?? code;
  });
}
