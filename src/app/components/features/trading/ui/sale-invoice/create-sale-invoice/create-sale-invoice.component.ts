import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  TngButtonComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngDatepickerComponent,
  TngInputComponent,
  TngLabelComponent,
  TngSelectComponent,
  TngSwitchComponent,
} from '@tailng-ui/components';
import { TngIcon } from '@tailng-ui/icons';
import dayjs from 'dayjs';
import { BurlBackButtonComponent } from '../../../../../../shared/burl-back-button/burl-back-button.component';
import { BurlNavigationService } from '../../../../../../shared/burl-back-button/burl-navigation.service';
import type { Customer } from '../../../data/customer';
import { CustomerStore } from '../../../data/customer';
import type { Item } from '../../../data/item';
import { ItemStore } from '../../../data/item';
import type {
  InvoiceAddress,
  SaleInvoice,
  SaleInvoiceItemRequest,
  SaleInvoiceItemTaxRequest,
  SaleInvoicePayload,
} from '../../../data/sale-invoice';
import { SaleInvoiceStore } from '../../../data/sale-invoice';
import { TaxStore } from '../../../data/tax';
import { TaxGroupStore } from '../../../data/tax-group';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number, dec = 2): string {
  return n.toFixed(dec);
}

// ── Internal row types ────────────────────────────────────────────────────────

interface TaxRow {
  taxid: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
}

interface ItemRow {
  item: Item | null;
  itemid: string;
  name: string;
  code: string;
  price: number;
  quantity: number;
  itemtotal: number;
  discpercent: number;
  discamount: number;
  subtotal: number;
  taxamount: number;
  grandtotal: number;
  taxes: TaxRow[];
  description: string;
}

// ── Select option shape for TngSelectComponent ────────────────────────────────

type SelectOption = Readonly<{ label: string; value: string }>;

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-create-sale-invoice',
  standalone: true,
  imports: [
    TngButtonComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngDatepickerComponent,
    TngInputComponent,
    TngIcon,
    TngLabelComponent,
    TngSelectComponent,
    TngSwitchComponent,
    BurlBackButtonComponent,
  ],
  templateUrl: './create-sale-invoice.component.html',
  styleUrl: './create-sale-invoice.component.css',
})
export class CreateSaleInvoiceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly burlNavigation = inject(BurlNavigationService);

  protected readonly saleInvoiceStore = inject(SaleInvoiceStore);
  protected readonly customerStore = inject(CustomerStore);
  protected readonly itemStore = inject(ItemStore);
  protected readonly taxGroupStore = inject(TaxGroupStore);
  protected readonly taxStore = inject(TaxStore);

  // ── Mode ──────────────────────────────────────────────────────────────────

  protected readonly id = signal<string | null>(null);
  protected readonly mode = computed(() => (this.id() ? 'edit' : 'create'));
  protected readonly title = computed(() =>
    this.mode() === 'edit' ? 'Edit Sale Invoice' : 'New Sale Invoice',
  );

  // ── UI / search state ─────────────────────────────────────────────────────

  protected readonly submitted = signal(false);
  protected readonly customerSearch = signal('');
  protected readonly showCustomerDropdown = signal(false);
  protected readonly showDiscount = signal(false);
  protected readonly showDescription = signal(false);
  protected readonly selectedCustomer = signal<Customer | null>(null);
  protected readonly activeItemRowIndex = signal(-1);
  protected readonly itemSearch = signal('');

  // ── Tax-mode options (derived from loaded tax groups) ─────────────────────

  protected readonly taxModeOptions = computed<SelectOption[]>(() => {
    const seen = new Set<string>(['Intra State', 'Inter State']);
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode) seen.add(g.mode);
      }
    }
    return Array.from(seen).map((m) => ({ label: m, value: m }));
  });

  readonly getOptionLabel = (o: SelectOption): string => o.label;
  readonly getOptionValue = (o: SelectOption): string => o.value;
  readonly trackByValue = (_: number, o: SelectOption): string => o.value;

  // ── Customer / item filtered lists ────────────────────────────────────────

  protected readonly filteredCustomers = computed<Customer[]>(() => {
    const q = this.customerSearch().toLowerCase();
    const list = this.customerStore.items() as Customer[];
    return (q ? list.filter((c) =>
      c.name?.toLowerCase().includes(q) ||
      c.mobile?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q),
    ) : list).slice(0, 15);
  });

  protected readonly filteredItems = computed<Item[]>(() => {
    const q = this.itemSearch().toLowerCase();
    const list = this.itemStore.items() as Item[];
    return (q ? list.filter((it) =>
      it.name?.toLowerCase().includes(q) ||
      it.code?.toLowerCase().includes(q) ||
      it.displayname?.toLowerCase().includes(q),
    ) : list).slice(0, 15);
  });

  // ── Invoice-property signals ──────────────────────────────────────────────

  protected readonly autoNumbering = signal(true);
  protected readonly numberEnabled = signal(false);
  protected readonly number = signal('Auto Number');
  protected readonly date = signal(dayjs().format('YYYY-MM-DD'));
  protected readonly duedate = signal(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  protected readonly currencycode = signal('INR');
  protected readonly taxoption = signal('Intra State');
  protected readonly deliverystate = signal('');

  // ── Customer / address signals ────────────────────────────────────────────

  protected readonly customerid = signal('');
  protected readonly useBillingForShipping = signal(true);
  protected readonly billingName = signal('');
  protected readonly billingLine1 = signal('');
  protected readonly billingLine2 = signal('');
  protected readonly billingCity = signal('');
  protected readonly billingState = signal('');
  protected readonly billingZip = signal('');
  protected readonly billingCountry = signal('');
  protected readonly shippingName = signal('');
  protected readonly shippingLine1 = signal('');
  protected readonly shippingLine2 = signal('');
  protected readonly shippingCity = signal('');
  protected readonly shippingState = signal('');
  protected readonly shippingZip = signal('');
  protected readonly shippingCountry = signal('');

  // ── Line items + roundoff ─────────────────────────────────────────────────

  protected readonly items = signal<ItemRow[]>([this.emptyItemRow()]);
  protected readonly roundoff = signal('0');

  // ── Computed summary ──────────────────────────────────────────────────────

  protected readonly itemtotal = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.itemtotal, 0)),
  );
  protected readonly discount = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.discamount, 0)),
  );
  protected readonly subtotal = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.subtotal, 0)),
  );
  protected readonly tax = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.taxamount, 0)),
  );
  protected readonly grandtotal = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.grandtotal, 0) + toNum(this.roundoff())),
  );

  // ── Validation ────────────────────────────────────────────────────────────

  protected readonly customerError = computed(() =>
    this.submitted() && !this.customerid() ? 'Customer is required.' : null,
  );
  protected readonly dateError = computed(() =>
    this.submitted() && !this.date() ? 'Date is required.' : null,
  );

  // ── How many tax columns the current tax option has ───────────────────────

  protected readonly taxColumnCount = computed<number>(() => {
    const opt = this.taxoption();
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode === opt) return (g.taxids ?? []).length;
      }
    }
    return 0;
  });

  protected readonly taxColumns = computed<{ name: string; shortname: string }[]>(() => {
    const opt = this.taxoption();
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode === opt && (g.taxids ?? []).length > 0) {
          return (g.taxids ?? []).map((taxId) => {
            const tax = this.taxStore.items().find((t) => t.id === taxId);
            return { name: tax?.name ?? '', shortname: tax?.shortname ?? taxId.slice(0, 4) };
          });
        }
      }
    }
    return [];
  });

  // ── Auto-numbering toggle effect ──────────────────────────────────────────

  private readonly _autoNumberingEffect = effect(() => {
    if (this.autoNumbering()) {
      this.numberEnabled.set(false);
      this.number.set('Auto Number');
    } else {
      this.numberEnabled.set(true);
    }
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
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
        includes: ['currency', 'customer', 'items.item.category.taxgroup', 'items.taxes.tax'],
      });
      if (invoice) this.patchFromInvoice(invoice);
    }
  }

  // ── Patch all signals from a loaded invoice (edit mode) ───────────────────

  private patchFromInvoice(inv: SaleInvoice): void {
    const cprops = inv.cprops;
    const auto = cprops?.autoNumbering ?? false;

    this.autoNumbering.set(auto);
    this.number.set(inv.number ?? '');
    this.numberEnabled.set(!auto);
    this.date.set(inv.date ?? '');
    this.duedate.set(inv.duedate ?? '');
    this.currencycode.set(inv.currencycode ?? inv.currency?.code ?? 'INR');
    this.taxoption.set(cprops?.taxoption ?? 'Intra State');
    this.deliverystate.set(cprops?.deliverystate ?? '');
    this.customerid.set(inv.customerid ?? inv.customer?.id ?? '');
    this.useBillingForShipping.set(cprops?.usebillingforshipping ?? false);

    if (inv.customer) {
      this.selectedCustomer.set(inv.customer as Customer);
      this.customerSearch.set(inv.customer.name ?? '');
    }

    const b = inv.billingaddress;
    this.billingName.set(b?.name ?? '');
    this.billingLine1.set(b?.line1 ?? '');
    this.billingLine2.set(b?.line2 ?? '');
    this.billingCity.set(b?.city ?? '');
    this.billingState.set(b?.state ?? '');
    this.billingZip.set(b?.zip ?? '');
    this.billingCountry.set(b?.country ?? '');

    const s = inv.shippingaddress;
    this.shippingName.set(s?.name ?? '');
    this.shippingLine1.set(s?.line1 ?? '');
    this.shippingLine2.set(s?.line2 ?? '');
    this.shippingCity.set(s?.city ?? '');
    this.shippingState.set(s?.state ?? '');
    this.shippingZip.set(s?.zip ?? '');
    this.shippingCountry.set(s?.country ?? '');

    this.roundoff.set(String(inv.roundoff ?? 0));

    this.items.set(
      (inv.items ?? []).map((si) => ({
        item: (si.item as Item) ?? null,
        itemid: si.itemid ?? si.item?.id ?? '',
        name: si.name,
        code: si.code,
        description: si.description ?? '',
        price: si.price,
        quantity: si.quantity,
        itemtotal: si.itemtotal,
        discpercent: si.discpercent ?? 0,
        discamount: si.discamount ?? 0,
        subtotal: si.subtotal,
        taxamount: si.taxamount ?? 0,
        grandtotal: si.grandtotal,
        taxes: (si.taxes ?? []).map((t) => ({
          taxid: t.taxid ?? t.tax?.id ?? '',
          name: t.name,
          shortname: t.shortname,
          rate: t.rate,
          appliedto: t.appliedto,
          amount: t.amount,
        })),
      })),
    );
  }

  // ── Customer autocomplete ─────────────────────────────────────────────────

  protected onCustomerSearchInput(value: string | null): void {
    const q = value ?? '';
    this.customerSearch.set(q);
    this.showCustomerDropdown.set(true);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
    }
    void this.customerStore.loadCustomers(
      q ? { where: { name: { ilike: `%${q}%` } } } : {},
    );
  }

  protected selectCustomer(customer: Customer): void {
    this.selectedCustomer.set(customer);
    this.customerSearch.set(customer.name);
    this.showCustomerDropdown.set(false);
    this.customerid.set(customer.id ?? '');
    this.currencycode.set(customer.currencycode ?? this.currencycode());
    this.deliverystate.set(customer.state ?? '');
    this.billingName.set(customer.address?.name ?? customer.name);
    this.billingLine1.set(customer.address?.line1 ?? '');
    this.billingLine2.set(customer.address?.line2 ?? '');
    this.billingCity.set(customer.address?.city ?? '');
    this.billingState.set(customer.address?.state ?? '');
    this.billingZip.set(customer.address?.zip ?? '');
    this.billingCountry.set(customer.address?.country ?? '');
    if (this.useBillingForShipping()) this.syncShippingFromBilling();
  }

  protected closeCustomerDropdown(): void {
    setTimeout(() => this.showCustomerDropdown.set(false), 200);
  }

  // ── Item autocomplete ─────────────────────────────────────────────────────

  protected onItemSearchInput(value: string | null, rowIndex: number): void {
    const q = value ?? '';
    this.itemSearch.set(q);
    this.activeItemRowIndex.set(rowIndex);
    void this.itemStore.loadItems(
      q
        ? { where: { name: { ilike: `%${q}%` } }, includes: ['category'] }
        : { includes: ['category'] },
    );
  }

  protected selectItem(item: Item, rowIndex: number): void {
    this.activeItemRowIndex.set(-1);
    this.itemSearch.set('');
    this.items.update((rows) =>
      rows.map((row, i) =>
        i === rowIndex
          ? { ...row, item, itemid: item.id ?? '', name: item.name, code: item.code ?? '' }
          : row,
      ),
    );
    this.applyTaxesToRow(rowIndex, item);
    this.recalcRow(rowIndex);
  }

  protected closeItemDropdown(): void {
    setTimeout(() => this.activeItemRowIndex.set(-1), 200);
  }

  protected getItemDisplayName(row: ItemRow): string {
    return row.item?.displayname ?? row.item?.name ?? row.name ?? '';
  }

  // ── Tax calculation helpers ───────────────────────────────────────────────

  private buildTaxes(item: Item, taxOption: string): TaxRow[] {
    type ItemWithCat = Item & { category?: { taxgroupid?: string } };
    const taxGroupId = (item as ItemWithCat).category?.taxgroupid;
    if (!taxGroupId || !taxOption) return [];

    const tg = this.taxGroupStore.items().find((g) => g.id === taxGroupId);
    const group = tg?.groups?.find((g) => g.mode === taxOption);
    if (!group) return [];

    return (group.taxids ?? []).map((taxId) => {
      const tax = this.taxStore.items().find((t) => t.id === taxId);
      return {
        taxid: tax?.id ?? taxId,
        name: tax?.name ?? '',
        shortname: tax?.shortname ?? '',
        rate: tax?.rate ?? 0,
        appliedto: tax?.appliedto ?? 100,
        amount: 0,
      };
    });
  }

  private applyTaxesToRow(rowIndex: number, item: Item): void {
    const taxes = this.buildTaxes(item, this.taxoption());
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, taxes } : row)),
    );
  }

  // ── Row field update + recalculation ──────────────────────────────────────

  protected updateItemField(
    rowIndex: number,
    field: 'price' | 'quantity' | 'discpercent',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, [field]: num } : row)),
    );
  }

  protected updateItemDescription(rowIndex: number, value: string | null): void {
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, description: value ?? '' } : row)),
    );
  }

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = toNum(row.quantity) || 1;
    const itemtotal = price * quantity;
    const discpercent = toNum(row.discpercent);
    const discamount = this.showDiscount() ? (itemtotal * discpercent) / 100 : 0;
    const subtotal = itemtotal - discamount;

    let taxamount = 0;
    const taxes = row.taxes.map((t) => {
      const amount = (subtotal * toNum(t.rate)) / 100;
      taxamount += amount;
      return { ...t, amount };
    });

    return { ...row, itemtotal, discamount, subtotal, taxamount, grandtotal: subtotal + taxamount, taxes };
  }

  protected recalcRow(rowIndex: number): void {
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? this.calcRow(row) : row)),
    );
  }

  // ── Tax-option change (rebuilds taxes for all rows) ───────────────────────

  protected onTaxOptionChange(value: string | null): void {
    const opt = value ?? 'Intra State';
    this.taxoption.set(opt);
    this.items.update((rows) =>
      rows.map((row) => {
        const updated = {
          ...row,
          taxes: row.item ? this.buildTaxes(row.item, opt) : [],
        };
        return this.calcRow(updated);
      }),
    );
  }

  // ── Date helpers ──────────────────────────────────────────────────────────

  protected onDateChange(value: unknown): void {
    if (typeof value === 'string') this.date.set(value);
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.date.set(dayjs(value).format('YYYY-MM-DD'));
  }

  protected onDueDateChange(value: unknown): void {
    if (typeof value === 'string') this.duedate.set(value);
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.duedate.set(dayjs(value).format('YYYY-MM-DD'));
  }

  // ── Billing ↔ shipping sync ───────────────────────────────────────────────

  private syncShippingFromBilling(): void {
    this.shippingName.set(this.billingName());
    this.shippingLine1.set(this.billingLine1());
    this.shippingLine2.set(this.billingLine2());
    this.shippingCity.set(this.billingCity());
    this.shippingState.set(this.billingState());
    this.shippingZip.set(this.billingZip());
    this.shippingCountry.set(this.billingCountry());
  }

  protected onBillingChange(): void {
    if (this.useBillingForShipping()) this.syncShippingFromBilling();
  }

  protected toggleUseBillingForShipping(value: boolean): void {
    this.useBillingForShipping.set(value);
    if (value) this.syncShippingFromBilling();
  }

  protected toggleAutoNumbering(value: boolean): void {
    this.autoNumbering.set(value);
    if (!value && this.number() === 'Auto Number') this.number.set('');
  }

  // ── Add / remove rows ─────────────────────────────────────────────────────

  private emptyTaxRow(): TaxRow {
    return { taxid: '', name: '', shortname: '', rate: 0, appliedto: 100, amount: 0 };
  }

  private emptyItemRow(taxCount = 0): ItemRow {
    return {
      item: null, itemid: '', name: '', code: '', description: '',
      price: 0, quantity: 1,
      itemtotal: 0, discpercent: 0, discamount: 0,
      subtotal: 0, taxamount: 0, grandtotal: 0,
      taxes: Array.from({ length: taxCount }, () => this.emptyTaxRow()),
    };
  }

  protected addItemRow(): void {
    this.items.update((rows) => [...rows, this.emptyItemRow(this.taxColumnCount())]);
  }

  protected removeItemRow(index: number): void {
    if (this.items().length > 1) {
      this.items.update((rows) => rows.filter((_, i) => i !== index));
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  protected async submitForm(event: Event): Promise<void> {
    event.preventDefault();
    this.submitted.set(true);
    if (!this.customerid() || !this.date()) return;

    const billing: InvoiceAddress = {
      name: this.billingName(),
      line1: this.billingLine1(),
      ...(this.billingLine2() ? { line2: this.billingLine2() } : {}),
      ...(this.billingCity() ? { city: this.billingCity() } : {}),
      ...(this.billingState() ? { state: this.billingState() } : {}),
      ...(this.billingZip() ? { zip: this.billingZip() } : {}),
      ...(this.billingCountry() ? { country: this.billingCountry() } : {}),
    };

    const shipping: InvoiceAddress = this.useBillingForShipping()
      ? billing
      : {
          name: this.shippingName(),
          line1: this.shippingLine1(),
          ...(this.shippingLine2() ? { line2: this.shippingLine2() } : {}),
          ...(this.shippingCity() ? { city: this.shippingCity() } : {}),
          ...(this.shippingState() ? { state: this.shippingState() } : {}),
          ...(this.shippingZip() ? { zip: this.shippingZip() } : {}),
          ...(this.shippingCountry() ? { country: this.shippingCountry() } : {}),
        };

    const items: SaleInvoiceItemRequest[] = this.items().map((row, i) => {
      const taxes: SaleInvoiceItemTaxRequest[] = row.taxes.map((t) => ({
        name: t.name, shortname: t.shortname,
        rate: toNum(t.rate), appliedto: toNum(t.appliedto), amount: toNum(t.amount),
        ...(t.taxid ? { taxid: t.taxid } : {}),
      }));
      return {
        name: row.name, code: row.code, order: i + 1,
        ...(row.description ? { description: row.description } : {}),
        price: toNum(row.price), quantity: toNum(row.quantity),
        itemtotal: toNum(row.itemtotal),
        ...(row.discpercent ? { discpercent: toNum(row.discpercent) } : {}),
        ...(row.discamount ? { discamount: toNum(row.discamount) } : {}),
        subtotal: toNum(row.subtotal),
        ...(row.taxamount ? { taxamount: toNum(row.taxamount) } : {}),
        grandtotal: toNum(row.grandtotal),
        itemid: row.itemid,
        taxes,
      };
    });

    const payload: SaleInvoicePayload = {
      ...(!this.autoNumbering() && this.number() ? { number: this.number() } : {}),
      date: this.date(), duedate: this.duedate(),
      itemtotal: toNum(this.itemtotal()),
      ...(toNum(this.discount()) ? { discount: toNum(this.discount()) } : {}),
      subtotal: toNum(this.subtotal()),
      ...(toNum(this.tax()) ? { tax: toNum(this.tax()) } : {}),
      ...(toNum(this.roundoff()) ? { roundoff: toNum(this.roundoff()) } : {}),
      grandtotal: toNum(this.grandtotal()),
      currencycode: this.currencycode(),
      billingaddress: billing, shippingaddress: shipping,
      customerid: this.customerid(),
      items,
      cprops: {
        autoNumbering: this.autoNumbering(),
        showdiscount: this.showDiscount(),
        taxoption: this.taxoption(),
        deliverystate: this.deliverystate(),
        usebillingforshipping: this.useBillingForShipping(),
      },
    };

    const id = this.id();
    const saved = id
      ? await this.saleInvoiceStore.updateSaleInvoice(id, payload)
      : await this.saleInvoiceStore.createSaleInvoice(payload);

    if (saved) await this.burlNavigation.navigateBack();
  }
}
