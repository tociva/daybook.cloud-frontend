import { Component, computed, inject, input } from '@angular/core';
import { form } from '@angular/forms/signals';
import { TngInputComponent, TngSwitchComponent, TngTextareaComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { PurchaseReturnDraftStore } from '../purchase-return-draft.store';

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
  imports: [TngInputComponent, TngSwitchComponent, TngTextareaComponent, TngIcon],
  templateUrl: './pr-line-items.component.html',
  styleUrl: './pr-line-items.component.css',
})
export class PrLineItemsComponent {
  protected readonly draft = inject(PurchaseReturnDraftStore);
  readonly readOnly = input(false);
  protected readonly lineItemsForm = form(this.draft.items);
  protected readonly rowCount = computed(() => this.lineItemsForm().value().length);

  readonly showIntraStateTax = computed(() => this.draft.taxoption() === 'Intra State');
  readonly showIGST = computed(() => this.draft.taxoption() === 'Inter State');
  readonly showQty1 = computed(() => !this.showIntraStateTax() && !this.showIGST());
  readonly rowSpan = computed(() => (this.showQty1() ? 1 : 2));

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

  private readonly taxFreeWidth = computed<number>(() => {
    const opt = this.draft.taxoption();
    if (opt === 'Intra State') return 8;
    if (opt === 'Inter State') return 16;
    return 24;
  });

  protected readonly nameColClass = computed(() => {
    const base = 'pr-li-col-name px-4 text-left';
    const tf = this.taxFreeWidth();
    if (this.draft.showDescription()) return `${base} w-${22 + tf / 2}`;
    return `${base} w-${46 + tf}`;
  });

  protected readonly descColClass = computed(() => {
    const base = 'pr-li-col-description px-4 text-left';
    return `${base} w-${24 + this.taxFreeWidth() / 2}`;
  });

  protected formatAmount(value: number | undefined | null): string {
    return value === undefined || value === null ? '—' : value.toFixed(2);
  }
}
