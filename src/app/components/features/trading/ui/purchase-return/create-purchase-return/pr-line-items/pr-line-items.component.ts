import { Component, ElementRef, computed, inject, input } from '@angular/core';
import { form } from '@angular/forms/signals';
import {
  TngAutocompleteComponent,
  TngInputComponent,
  TngSwitchComponent,
  TngTextareaComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import type { Item } from '../../../../data/item';
import { PurchaseReturnDraftStore, type ItemRow } from '../purchase-return-draft.store';

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
  selector: 'app-pr-line-items',
  standalone: true,
  imports: [
    TngAutocompleteComponent,
    TngInputComponent,
    TngSwitchComponent,
    TngTextareaComponent,
    TngIcon,
  ],
  templateUrl: './pr-line-items.component.html',
  styleUrl: './pr-line-items.component.css',
})
export class PrLineItemsComponent {
  protected readonly draft = inject(PurchaseReturnDraftStore);
  readonly readOnly = input(false);
  protected readonly lineItemsForm = form(this.draft.items);
  protected readonly rowCount = computed(() => this.lineItemsForm().value().length);
  protected readonly itemOptionValue = (item: Item): string => item.id ?? '';
  protected readonly itemOptionLabel = (item: Item): string =>
    item.displayname ?? item.name ?? '';
  protected readonly itemTrackBy = (_index: number, item: Item): unknown => item.id ?? item.name;
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly showIntraStateTax = computed(() => this.draft.taxoption() === 'Intra State');
  readonly showIGST = computed(() => this.draft.taxoption() === 'Inter State');

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
        `.pr-li-col-price[data-row-index="${rowIndex}"] [data-slot="input"]`,
      );
      priceInput?.focus();
      priceInput?.select();
    });
  }

  protected formatAmount(value: number | undefined | null): string {
    return value === undefined || value === null ? '—' : value.toFixed(2);
  }
}
