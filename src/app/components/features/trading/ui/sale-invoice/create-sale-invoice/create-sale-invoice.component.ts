import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TngButtonComponent } from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { CustomerStore } from '../../../data/customer';
import { ItemStore } from '../../../data/item';
import type {
  InvoiceAddress,
  SaleInvoiceItemRequest,
  SaleInvoiceItemTaxRequest,
  SaleInvoicePayload,
} from '../../../data/sale-invoice';
import {
  SALE_INVOICE_DETAIL_INCLUDES,
  SaleInvoiceFacade,
  SaleInvoiceStore,
} from '../../../data/sale-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';
import { SaleInvoiceDraftStore, toNum } from './sale-invoice-draft.store';
import { SiCustomerComponent } from './si-customer/si-customer.component';
import { SiInvoiceDetailsComponent } from './si-invoice-details/si-invoice-details.component';
import { SiLineItemsComponent } from './si-line-items/si-line-items.component';

@Component({
  selector: 'app-create-sale-invoice',
  standalone: true,
  providers: [SaleInvoiceDraftStore],
  imports: [
    TngButtonComponent,
    TngIcon,
    BurlBackButtonComponent,
    SiCustomerComponent,
    SiLineItemsComponent,
    SiInvoiceDetailsComponent,
  ],
  templateUrl: './create-sale-invoice.component.html',
  styleUrl: './create-sale-invoice.component.css',
})
export class CreateSaleInvoiceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly facade = inject(SaleInvoiceFacade);

  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  private readonly customerStore = inject(CustomerStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);

  protected readonly draft = inject(SaleInvoiceDraftStore);

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Sale Invoice' : 'New Sale Invoice',
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() {
    void this.loadInitialState();
  }

  private async loadInitialState(): Promise<void> {
    await Promise.all([
      this.customerStore.loadCustomers({}),
      this.itemStore.loadItems({ includes: ['category'] }),
      this.taxGroupStore.loadTaxGroups({}),
      this.taxStore.loadTaxes({}),
    ]);

    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      const invoice = await this.saleInvoiceStore.loadSaleInvoiceById(id, {
        includes: SALE_INVOICE_DETAIL_INCLUDES,
      });
      if (invoice) this.draft.patchFromInvoice(invoice);
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.draft.submitted.set(true);
    if (!this.draft.customerid() || this.draft.dateError() !== null) return;

    const billing: InvoiceAddress = {
      name: this.draft.billingName(),
      line1: this.draft.billingLine1(),
      ...(this.draft.billingLine2() ? { line2: this.draft.billingLine2() } : {}),
      ...(this.draft.billingCity() ? { city: this.draft.billingCity() } : {}),
      ...(this.draft.billingState() ? { state: this.draft.billingState() } : {}),
      ...(this.draft.billingZip() ? { zip: this.draft.billingZip() } : {}),
      ...(this.draft.billingCountry() ? { country: this.draft.billingCountry() } : {}),
    };

    const shipping: InvoiceAddress = this.draft.useBillingForShipping()
      ? billing
      : {
          name: this.draft.shippingName(),
          line1: this.draft.shippingLine1(),
          ...(this.draft.shippingLine2() ? { line2: this.draft.shippingLine2() } : {}),
          ...(this.draft.shippingCity() ? { city: this.draft.shippingCity() } : {}),
          ...(this.draft.shippingState() ? { state: this.draft.shippingState() } : {}),
          ...(this.draft.shippingZip() ? { zip: this.draft.shippingZip() } : {}),
          ...(this.draft.shippingCountry() ? { country: this.draft.shippingCountry() } : {}),
        };

    const items: SaleInvoiceItemRequest[] = this.draft.items().map((row, i) => {
      const taxes: SaleInvoiceItemTaxRequest[] = row.taxes.map((t) => ({
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
        quantity: Math.max(1, toNum(this.draft.quantityForRow(row))),
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

    const payload: SaleInvoicePayload = {
      ...(!this.draft.autoNumbering() && this.draft.number()
        ? { number: this.draft.number() }
        : {}),
      date: this.draft.date(),
      duedate: this.draft.duedate(),
      itemtotal: toNum(this.draft.itemtotal()),
      discount: toNum(this.draft.discount()),
      subtotal: toNum(this.draft.subtotal()),
      tax: toNum(this.draft.tax()),
      roundoff: toNum(this.draft.roundoff()),
      grandtotal: toNum(this.draft.grandtotal()),
      currencycode: this.draft.currencycode(),
      billingaddress: billing,
      shippingaddress: shipping,
      description: '',
      customerid: this.draft.customerid(),
      items,
      cprops: {
        autoNumbering: this.draft.autoNumbering(),
        showdiscount: this.draft.showDiscount(),
        showdescription: this.draft.showDescription(),
        taxoption: this.draft.taxoption(),
        deliverystate: this.draft.deliverystate(),
        usebillingforshipping: this.draft.useBillingForShipping(),
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
