import { Component, ElementRef, computed, inject } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
  TngAutocompleteComponent,
  TngInputComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { Item } from '../../../../data/item';
import { SaleInvoiceDraftStore, type ItemRow } from '../sale-invoice-draft.store';

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
    TngInputComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    TngIcon,
  ],
  templateUrl: './si-line-items.component.html',
  styleUrl: './si-line-items.component.css',
})
export class SiLineItemsComponent {
  protected readonly draft = inject(SaleInvoiceDraftStore);
  protected readonly lineItemsForm = form(this.draft.items);
  protected readonly rowCount = computed(() => this.lineItemsForm().value().length);
  protected readonly itemOptionValue = (item: Item): string => item.id ?? '';
  protected readonly itemOptionLabel = (item: Item): string => item.displayname ?? item.name ?? '';
  protected readonly itemTrackBy = (_index: number, item: Item): unknown => item.id ?? item.name;
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  // ── Tax column visibility (derived from draft tax option) ──────────────
  // Intra State → CGST + SGST; Inter State → IGST only; Export / No Taxable → none
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

  protected focusNameAutocomplete(event: MouseEvent): void {
    this.focusTableControl(event, '[data-slot="autocomplete-trigger"]');
  }

  protected focusTableInput(event: MouseEvent): void {
    this.focusTableControl(event, '[data-slot="input"]');
  }

  protected focusTableTextarea(event: MouseEvent): void {
    this.focusTableControl(event, 'textarea');
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

  private focusPriceInputAfterSelection(rowIndex: number): void {
    globalThis.setTimeout(() => {
      const priceInput = this.hostElement.nativeElement.querySelector<HTMLInputElement>(
        `.si-li-col-price[data-row-index="${rowIndex}"] [data-slot="input"]`,
      );

      priceInput?.focus();
      priceInput?.select();
    });
  }

  // ── Width freed by hidden tax columns ──────────────────────────────────
  // Each tax group occupies label(3%) + pct/amt(5%) = 8% of table width.
  // Intra State shows CGST+SGST (16%), frees IGST (8%).
  // Inter State shows IGST (8%), frees CGST+SGST (16%).
  // Export / No Taxable shows nothing, frees all three (24%).
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
  // Freed tax space (taxFreeWidth) is split evenly between name and desc
  // when desc is ON; otherwise the full amount goes to name.
  // disc freed: disc-label(3%) + disc-pct(5%) + taxable(7%) = 15%
  nameColClass = computed(() => {
    const disc = this.draft.showDiscount();
    const desc = this.draft.showDescription();
    const tf   = this.taxFreeWidth();
    const base = 'si-li-col-name px-4 text-left';

    if ( disc &&  desc) return `${base} w-${15 + tf / 2}`;
    if ( disc && !desc) return `${base} w-${31 + tf}`;
    if (!disc &&  desc) return `${base} w-${22 + tf / 2}`;
    return `${base} w-${46 + tf}`;
  });

  descColClass = computed(() => {
    const base = 'si-li-col-description px-4 text-left';
    const tf   = this.taxFreeWidth();
    // disc=ON → base desc 16%; disc=OFF → base desc 24%
    return `${base} w-${(this.draft.showDiscount() ? 16 : 24) + tf / 2}`;
  });
}
