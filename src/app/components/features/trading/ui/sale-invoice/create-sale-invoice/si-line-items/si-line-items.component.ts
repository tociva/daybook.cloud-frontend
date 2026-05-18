import { Component, ElementRef, computed, inject, input } from '@angular/core';
import { form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import {
  TngAutocompleteComponent,
  TngInputComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { Item } from '../../../../data/item';
import { ItemStore } from '../../../../data/item';
import { UserSessionStore } from '../../../../../management/data/user-session/user-session.store';
import { SaleInvoiceDraftStore, type ItemRow } from '../sale-invoice-draft.store';

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
    TngInputComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    TngIcon,
  ],
  templateUrl: './si-line-items.component.html',
  styleUrl: './si-line-items.component.css',
})
export class SiLineItemsComponent {
  protected readonly draft        = inject(SaleInvoiceDraftStore);
  private  readonly userSession   = inject(UserSessionStore);
  private  readonly itemStore     = inject(ItemStore);
  private  readonly router        = inject(Router);
  readonly readOnly = input(false);
  protected readonly lineItemsForm = form(this.draft.items);
  protected readonly rowCount = computed(() => this.lineItemsForm().value().length);
  protected readonly itemOptionValue = (item: Item): string => item.id ?? '';
  protected readonly itemOptionLabel = (item: Item): string => item.displayname ?? item.name ?? '';
  protected readonly itemTrackBy = (_index: number, item: Item): unknown => item.id ?? item.name;
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Expose sentinel id so the template can detect the create-action row. */
  protected readonly createItemSentinelId = CREATE_ITEM_SENTINEL_ID;

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
    if (options.length === 0) {
      return [CREATE_ITEM_SENTINEL];
    }
    return options;
  }

  protected createNewItem(rowIndex: number): void {
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

  private focusTableControl(event: MouseEvent, selector: string): void {
    if (event.defaultPrevented) return;

    const target = event.target;
    const currentTarget = event.currentTarget;
    if (!(target instanceof Element) || !(currentTarget instanceof HTMLElement)) return;

    const interactiveTarget = target.closest(INTERACTIVE_CLICK_TARGET_SELECTOR);
    if (interactiveTarget !== null && currentTarget.contains(interactiveTarget)) return;

    currentTarget.querySelector<HTMLElement>(selector)?.focus();
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

  protected formatAmount(value: number | undefined | null): string {
    return value === undefined || value === null ? '—' : value.toFixed(2);
  }

  // ── Currency symbol ────────────────────────────────────────────────────────
  readonly currencySymbol = computed(() => {
    const session = this.userSession.session();
    const code    = session?.fiscalyear?.currencycode
                 ?? session?.branch?.currencycode
                 ?? 'INR';
    const symbols: Record<string, string> = {
      AED: 'د.إ', AUD: 'A$',  BDT: '৳',   CAD: 'C$',  CHF: 'Fr',
      CNY: '¥',   EUR: '€',   GBP: '£',   INR: '₹',   JPY: '¥',
      LKR: 'Rs',  MYR: 'RM',  NPR: '₨',   NZD: 'NZ$', OMR: 'ر.ع.',
      PKR: '₨',   QAR: 'ر.ق', SAR: 'ر.س', SGD: 'S$',  USD: '$',
    };
    return symbols[code] ?? code;
  });

  // ── Amount in words ────────────────────────────────────────────────────────
  // Currency name  → fiscal year currencycode (falls back to branch currencycode)
  // Number system  → branch countrycode: 'IN' = lakh/crore, else million/billion
  readonly amountInWords = computed(() => {
    const session      = this.userSession.session();
    const currencycode = session?.fiscalyear?.currencycode
                      ?? session?.branch?.currencycode
                      ?? 'INR';
    const countrycode  = session?.branch?.countrycode ?? 'IN';
    return this.convertToWords(
      parseFloat(String(this.draft.grandtotal())) || 0,
      currencycode,
      countrycode,
    );
  });

  private convertToWords(amount: number, currencycode: string, countrycode: string): string {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numToWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return ones[n]! + ' ';
      if (n < 100) return tens[Math.floor(n / 10)]! + (n % 10 ? ' ' + ones[n % 10]! : '') + ' ';
      return ones[Math.floor(n / 100)]! + ' Hundred ' + numToWords(n % 100);
    };

    const { major, minor } = this.getCurrencyNames(currencycode);
    const useIndianSystem  = countrycode === 'IN';

    const wholeAmount = Math.floor(amount);
    const subunit     = Math.round((amount - wholeAmount) * 100);

    let result = '';
    if (wholeAmount === 0) {
      result = 'Zero';
    } else if (useIndianSystem) {
      // Indian system: Crore → Lakh → Thousand → remainder
      const crore     = Math.floor(wholeAmount / 10_000_000);
      const lakh      = Math.floor((wholeAmount % 10_000_000) / 100_000);
      const thousand  = Math.floor((wholeAmount % 100_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (crore)     result += numToWords(crore)    + 'Crore ';
      if (lakh)      result += numToWords(lakh)     + 'Lakh ';
      if (thousand)  result += numToWords(thousand) + 'Thousand ';
      if (remainder) result += numToWords(remainder);
    } else {
      // International system: Billion → Million → Thousand → remainder
      const billion   = Math.floor(wholeAmount / 1_000_000_000);
      const million   = Math.floor((wholeAmount % 1_000_000_000) / 1_000_000);
      const thousand  = Math.floor((wholeAmount % 1_000_000) / 1_000);
      const remainder = wholeAmount % 1_000;

      if (billion)   result += numToWords(billion)  + 'Billion ';
      if (million)   result += numToWords(million)  + 'Million ';
      if (thousand)  result += numToWords(thousand) + 'Thousand ';
      if (remainder) result += numToWords(remainder);
    }

    result = result.trim() + ' ' + major;
    if (subunit > 0) result += ' and ' + numToWords(subunit).trim() + ' ' + minor;
    return result + ' Only';
  }

  /** Maps ISO 4217 currency codes to their spoken major/minor unit names. */
  private getCurrencyNames(code: string): { major: string; minor: string } {
    const map: Record<string, { major: string; minor: string }> = {
      AED: { major: 'Dirhams',  minor: 'Fils' },
      AUD: { major: 'Dollars',  minor: 'Cents' },
      BDT: { major: 'Taka',     minor: 'Paisa' },
      CAD: { major: 'Dollars',  minor: 'Cents' },
      CHF: { major: 'Francs',   minor: 'Centimes' },
      CNY: { major: 'Yuan',     minor: 'Jiao' },
      EUR: { major: 'Euros',    minor: 'Cents' },
      GBP: { major: 'Pounds',   minor: 'Pence' },
      INR: { major: 'Rupees',   minor: 'Paise' },
      JPY: { major: 'Yen',      minor: 'Sen' },
      LKR: { major: 'Rupees',   minor: 'Cents' },
      MYR: { major: 'Ringgit',  minor: 'Sen' },
      NPR: { major: 'Rupees',   minor: 'Paisa' },
      NZD: { major: 'Dollars',  minor: 'Cents' },
      OMR: { major: 'Riyals',   minor: 'Baisa' },
      PKR: { major: 'Rupees',   minor: 'Paisa' },
      QAR: { major: 'Riyals',   minor: 'Dirhams' },
      SAR: { major: 'Riyals',   minor: 'Halalah' },
      SGD: { major: 'Dollars',  minor: 'Cents' },
      USD: { major: 'Dollars',  minor: 'Cents' },
    };
    return map[code] ?? { major: code, minor: 'Cents' };
  }
}
