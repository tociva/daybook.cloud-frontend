import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type {
  PurchaseReturnItemRequest,
  PurchaseReturnItemTaxRequest,
  PurchaseReturnPayload,
} from '../../../data/purchase-return';
import {
  PURCHASE_RETURN_DETAIL_INCLUDES,
  PurchaseReturnFacade,
  PurchaseReturnStore,
} from '../../../data/purchase-return';
import { PurchaseReturnDraftStore, toNum } from './purchase-return-draft.store';
import { PrInvoiceRefComponent } from './pr-invoice-ref/pr-invoice-ref.component';
import { PrReturnDetailsComponent } from './pr-return-details/pr-return-details.component';
import { PrLineItemsComponent } from './pr-line-items/pr-line-items.component';

@Component({
  selector: 'app-create-purchase-return',
  standalone: true,
  providers: [PurchaseReturnDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    PrInvoiceRefComponent,
    PrLineItemsComponent,
    PrReturnDetailsComponent,
  ],
  templateUrl: './create-purchase-return.component.html',
  styleUrl: './create-purchase-return.component.css',
})
export class CreatePurchaseReturnComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseReturnFacade);

  protected readonly purchaseReturnStore = inject(PurchaseReturnStore);
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);

  protected readonly draft = inject(PurchaseReturnDraftStore);

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Purchase Return' : 'New Purchase Return',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseReturnStore.clearError();

    await this.purchaseInvoiceStore.loadPurchaseInvoices({ includes: ['vendor'] });

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const cached = this.purchaseReturnStore.selectedItem();
      if (cached?.id === id) this.draft.patchFromReturn(cached);

      const ret = await this.purchaseReturnStore.loadPurchaseReturnById(id, {
        includes: PURCHASE_RETURN_DETAIL_INCLUDES,
      });
      if (ret) {
        this.draft.patchFromReturn(ret);
        const invoiceId = ret.purchaseinvoiceid ?? ret.purchaseinvoice?.id;
        if (invoiceId) await this.draft.mergeInvoiceItemsForEdit(invoiceId);
      }
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (!this.draft.purchaseinvoiceid() || this.draft.dateError() !== null) return;

    const returnRows = this.draft.items().filter((row) => row.itemid && toNum(row.quantity) > 0);

    const items: PurchaseReturnItemRequest[] = returnRows.map((row, i) => {
      const taxes: PurchaseReturnItemTaxRequest[] = row.taxes.map((t) => ({
        name: t.name,
        shortname: t.shortname,
        rate: toNum(t.rate),
        appliedto: toNum(t.appliedto),
        amount: toNum(t.amount),
        ...(t.taxid ? { taxid: t.taxid } : {}),
      }));
      const displayname = row.item?.displayname ?? row.item?.name ?? row.name ?? '';

      return {
        name: row.name,
        displayname,
        description: row.description,
        code: row.code,
        order: i + 1,
        price: toNum(row.price),
        quantity: toNum(row.quantity),
        itemtotal: toNum(row.itemtotal),
        taxamount: toNum(row.taxamount),
        grandtotal: toNum(row.grandtotal),
        itemid: row.itemid,
        taxes,
      };
    });

    const payload: PurchaseReturnPayload = {
      ...(this.draft.number() ? { number: this.draft.number() } : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      description: this.draft.description(),
      purchaseinvoiceid: this.draft.purchaseinvoiceid(),
      items,
      cprops: {
        showdescription: this.draft.showDescription(),
        taxoption: this.draft.taxoption(),
      },
    };

    const id = this.id();
    if (id) {
      await this.facade.update(id, payload);
    } else {
      await this.facade.create(payload);
    }
  }
}
