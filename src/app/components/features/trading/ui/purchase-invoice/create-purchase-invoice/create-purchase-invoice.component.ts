import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlCreateButtonComponent } from '../../../../../../shared/burl-create-button/burl-create-button.component';
import { VendorStore } from '../../../data/vendor';
import { ItemStore } from '../../../data/item';
import type {
  PurchaseInvoiceItemRequest,
  PurchaseInvoiceItemTaxRequest,
  PurchaseInvoicePayload,
  VendorAddress,
} from '../../../data/purchase-invoice';
import {
  PURCHASE_INVOICE_DETAIL_INCLUDES,
  PurchaseInvoiceFacade,
  PurchaseInvoiceStore,
} from '../../../data/purchase-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { PurchaseInvoiceDraftStore, toNum } from './purchase-invoice-draft.store';
import { PiVendorComponent } from './pi-vendor/pi-vendor.component';
import { PiInvoiceDetailsComponent } from './pi-invoice-details/pi-invoice-details.component';
import { PiLineItemsComponent } from './pi-line-items/pi-line-items.component';

@Component({
  selector: 'app-create-purchase-invoice',
  standalone: true,
  providers: [PurchaseInvoiceDraftStore],
  imports: [
    BurlBackButtonComponent,
    BurlCreateButtonComponent,
    PiVendorComponent,
    PiLineItemsComponent,
    PiInvoiceDetailsComponent,
  ],
  templateUrl: './create-purchase-invoice.component.html',
  styleUrl: './create-purchase-invoice.component.css',
})
export class CreatePurchaseInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(PurchaseInvoiceFacade);

  protected readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly vendorStore = inject(VendorStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);

  protected readonly draft = inject(PurchaseInvoiceDraftStore);

  @ViewChild(PiLineItemsComponent) private lineItemsRef?: PiLineItemsComponent;

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Purchase Invoice' : 'New Purchase Invoice',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    this.purchaseInvoiceStore.clearError();

    await Promise.all([
      this.vendorStore.loadVendors({}),
      this.itemStore.loadItems({ includes: ['category'] }),
      this.taxGroupStore.loadTaxGroups({}),
      this.taxStore.loadTaxes({}),
    ]);
    this.draft.markAllItemsLoaded();

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const cached = this.purchaseInvoiceStore.selectedItem();
      if (cached?.id === id) this.draft.patchFromInvoice(cached);

      const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, {
        includes: PURCHASE_INVOICE_DETAIL_INCLUDES,
      });
      if (invoice) this.draft.patchFromInvoice(invoice);
      return;
    }

    this.draft.patchFromGstReconciliation(this.route.snapshot.queryParamMap);
  }

  // ── Vendor selection ──────────────────────────────────────────────────────

  protected onVendorSelected(): void {
    this.lineItemsRef?.focusItemAutocomplete(0);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (!this.draft.vendorid() || this.draft.dateError() !== null) return;

    const vendoraddress: VendorAddress = {
      name: this.draft.vendorAddressName(),
      line1: this.draft.vendorAddressLine1(),
      ...(this.draft.vendorAddressLine2() ? { line2: this.draft.vendorAddressLine2() } : {}),
      ...(this.draft.vendorAddressCity() ? { city: this.draft.vendorAddressCity() } : {}),
      ...(this.draft.vendorAddressState() ? { state: this.draft.vendorAddressState() } : {}),
      ...(this.draft.vendorAddressZip() ? { zip: this.draft.vendorAddressZip() } : {}),
      ...(this.draft.vendorAddressCountry() ? { country: this.draft.vendorAddressCountry() } : {}),
    };

    const items: PurchaseInvoiceItemRequest[] = this.draft.items().filter((row) => !!row.itemid).map((row, i) => {
      const taxes: PurchaseInvoiceItemTaxRequest[] = row.taxes.map((t) => ({
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
        quantity: Math.max(1, toNum(row.quantity)),
        itemtotal: toNum(row.itemtotal),
        discpercent: toNum(row.discpercent),
        discamount: toNum(row.discamount),
        subtotal: toNum(row.subtotal),
        taxamount: toNum(row.taxamount),
        grandtotal: toNum(row.grandtotal),
        itemid: row.itemid,
        taxes,
      };
    });

    const payload: PurchaseInvoicePayload = {
      ...(this.draft.number() ? { number: this.draft.number() } : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      discount: toNum(this.draft.discount()),
      subtotal: toNum(this.draft.subtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      currencycode: this.draft.currencycode(),
      vendoraddress,
      description: this.draft.description(),
      vendorid: this.draft.vendorid(),
      items,
      cprops: {
        showdiscount: this.draft.showDiscount(),
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
