import { Injectable, computed, effect, inject, signal } from '@angular/core';
import dayjs from 'dayjs';
import type { Customer } from '../../../data/customer';
import { CustomerStore } from '../../../data/customer';
import type { Item } from '../../../data/item';
import { ItemStore } from '../../../data/item';
import type { ItemCategory } from '../../../data/item-category';
import { ItemCategoryStore } from '../../../data/item-category';
import type { SaleInvoice } from '../../../data/sale-invoice';
import type { Tax } from '../../../data/tax';
import { TaxStore } from '../../../data/tax';
import type { TaxGroup } from '../../../data/tax-group';
import { TaxGroupStore } from '../../../data/tax-group';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-datepicker';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function fmt(n: number, dec = 2): string {
  return n.toFixed(dec);
}

// ── Internal row types ────────────────────────────────────────────────────────

export interface TaxRow {
  taxid: string;
  name: string;
  shortname: string;
  rate: number;
  appliedto: number;
  amount: number;
}

export interface ItemRow {
  item: Item | null;
  itemid: string;
  name: string;
  code: string;
  price: number;
  quantity1: number;
  quantity2: number;
  itemtotal: number;
  discpercent: number;
  discamount: number;
  subtotal: number;
  taxamount: number;
  grandtotal: number;
  taxes: TaxRow[];
  description: string;
}

export type SelectOption = Readonly<{ label: string; value: string }>;

// ── Draft Store ───────────────────────────────────────────────────────────────

@Injectable()
export class SaleInvoiceDraftStore {
  private readonly customerStore = inject(CustomerStore);
  private readonly itemStore = inject(ItemStore);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  // ── Submission flag ───────────────────────────────────────────────────────

  readonly submitted = signal(false);

  // ── Invoice detail signals ────────────────────────────────────────────────

  readonly autoNumbering = signal(true);
  readonly numberEnabled = signal(false);
  readonly number = signal('Auto Number');
  /** Stores the server-assigned number when editing an existing invoice. */
  readonly invoiceNumber = signal('');
  readonly date = signal(this.fiscalYearDateRange.defaultDate());
  readonly duedate = signal(dayjs().add(7, 'day').format('YYYY-MM-DD'));
  readonly currencycode = signal('INR');
  readonly taxoption = signal('Intra State');
  readonly deliverystate = signal('');

  // ── Customer / address signals ────────────────────────────────────────────

  readonly customerid = signal('');
  readonly selectedCustomer = signal<Customer | null>(null);
  readonly customerSearch = signal('');
  readonly showCustomerDropdown = signal(false);
  readonly useBillingForShipping = signal(true);
  readonly billingName = signal('');
  readonly billingLine1 = signal('');
  readonly billingLine2 = signal('');
  readonly billingCity = signal('');
  readonly billingState = signal('');
  readonly billingZip = signal('');
  readonly billingCountry = signal('');
  readonly shippingName = signal('');
  readonly shippingLine1 = signal('');
  readonly shippingLine2 = signal('');
  readonly shippingCity = signal('');
  readonly shippingState = signal('');
  readonly shippingZip = signal('');
  readonly shippingCountry = signal('');

  // ── Line item signals ─────────────────────────────────────────────────────

  readonly items = signal<ItemRow[]>([this.emptyItemRow()]);
  readonly roundoff = signal('0');
  readonly showDiscount = signal(false);
  readonly showDescription = signal(false);
  readonly activeItemRowIndex = signal(-1);
  readonly itemSearch = signal('');

  // ── Tax-mode options ──────────────────────────────────────────────────────

  readonly taxModeOptions = computed<SelectOption[]>(() => {
    const seen = new Set<string>(['Intra State', 'Inter State']);
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode) seen.add(g.mode);
      }
    }
    return Array.from(seen).map((m) => ({ label: m, value: m }));
  });

  // ── Filtered lists ────────────────────────────────────────────────────────

  readonly filteredCustomers = computed<Customer[]>(() => {
    const q = this.customerSearch().toLowerCase();
    const list = this.customerStore.items() as Customer[];
    return (
      q
        ? list.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.mobile?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q),
          )
        : list
    ).slice(0, 15);
  });

  readonly filteredItems = computed<Item[]>(() => {
    const q = this.itemSearch().toLowerCase();
    const list = this.itemStore.items() as Item[];
    return (
      q
        ? list.filter(
            (it) =>
              it.name?.toLowerCase().includes(q) ||
              it.code?.toLowerCase().includes(q) ||
              it.displayname?.toLowerCase().includes(q),
          )
        : list
    ).slice(0, 15);
  });

  // ── Tax column computed ───────────────────────────────────────────────────

  readonly taxColumnCount = computed<number>(() => {
    const opt = this.taxoption();
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode === opt) return (g.taxids ?? []).length;
      }
    }
    return 0;
  });

  readonly taxColumns = computed<{ name: string; shortname: string }[]>(() => {
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

  // ── Computed summary ──────────────────────────────────────────────────────

  readonly itemtotal = computed(() => fmt(this.items().reduce((s, r) => s + r.itemtotal, 0)));
  readonly discount = computed(() => fmt(this.items().reduce((s, r) => s + r.discamount, 0)));
  readonly subtotal = computed(() => fmt(this.items().reduce((s, r) => s + r.subtotal, 0)));
  readonly tax = computed(() => fmt(this.items().reduce((s, r) => s + r.taxamount, 0)));
  readonly grandtotal = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.grandtotal, 0) + toNum(this.roundoff())),
  );

  // ── Validation ────────────────────────────────────────────────────────────

  readonly customerError = computed(() =>
    this.submitted() && !this.customerid() ? 'Customer is required.' : null,
  );
  readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.date()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.date());
  });

  // ── Auto-numbering effect ─────────────────────────────────────────────────

  private readonly _autoNumberingEffect = effect(() => {
    if (this.autoNumbering()) {
      this.numberEnabled.set(false);
      // In edit mode use the server-assigned number; in create mode fall back to placeholder.
      this.number.set(this.invoiceNumber() || 'Auto Number');
    } else {
      this.numberEnabled.set(true);
    }
  });

  // ── Patch from loaded invoice (edit mode) ─────────────────────────────────

  patchFromInvoice(inv: SaleInvoice): void {
    const cprops = inv.cprops;
    const auto = cprops?.autoNumbering ?? false;

    this.invoiceNumber.set(inv.number ?? '');
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
    this.showDiscount.set(cprops?.showdiscount ?? false);
    this.showDescription.set(cprops?.showdescription ?? false);

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
        quantity1: si.quantity,
        quantity2: si.quantity,
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

  // ── Customer methods ──────────────────────────────────────────────────────

  onCustomerSearchInput(value: string | null): void {
    const q = value ?? '';
    this.customerSearch.set(q);
    this.showCustomerDropdown.set(true);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
    }
    void this.customerStore.loadCustomers(q ? { where: { name: { ilike: `%${q}%` } } } : {});
  }

  selectCustomer(customer: Customer): void {
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

  closeCustomerDropdown(): void {
    this.showCustomerDropdown.set(false);
  }

  // ── Address methods ───────────────────────────────────────────────────────

  private syncShippingFromBilling(): void {
    this.shippingName.set(this.billingName());
    this.shippingLine1.set(this.billingLine1());
    this.shippingLine2.set(this.billingLine2());
    this.shippingCity.set(this.billingCity());
    this.shippingState.set(this.billingState());
    this.shippingZip.set(this.billingZip());
    this.shippingCountry.set(this.billingCountry());
  }

  onBillingChange(): void {
    if (this.useBillingForShipping()) this.syncShippingFromBilling();
  }

  toggleUseBillingForShipping(value: boolean): void {
    this.useBillingForShipping.set(value);
    if (value) this.syncShippingFromBilling();
  }

  // ── Invoice detail methods ────────────────────────────────────────────────

  toggleAutoNumbering(value: boolean): void {
    this.autoNumbering.set(value);
    if (!value && this.number() === 'Auto Number') this.number.set('');
  }

  onDateChange(value: unknown): void {
    let newDate = '';
    if (typeof value === 'string') newDate = value;
    else if (dayjs.isDayjs(value) && value.isValid()) newDate = value.format('YYYY-MM-DD');
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      newDate = dayjs(value).format('YYYY-MM-DD');

    if (!newDate) return;
    this.date.set(newDate);

    // Ensure due date is never before the invoice date
    if (this.duedate() && this.duedate() < newDate) {
      this.duedate.set(newDate);
    }
  }

  onDueDateChange(value: unknown): void {
    if (typeof value === 'string') this.duedate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid()) this.duedate.set(value.format('YYYY-MM-DD'));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.duedate.set(dayjs(value).format('YYYY-MM-DD'));
  }

  onTaxOptionChange(value: string | null): void {
    const opt = value ?? 'Intra State';
    this.taxoption.set(opt);
    this.items.update((rows) =>
      rows.map((row) => {
        const updated = { ...row, taxes: row.item ? this.buildTaxes(row.item, opt) : [] };
        return this.calcRow(updated);
      }),
    );
  }

  // ── Item methods ──────────────────────────────────────────────────────────

  onItemSearchInput(value: string | null, rowIndex: number): void {
    const q = value ?? '';
    this.itemSearch.set(q);
    this.activeItemRowIndex.set(rowIndex);
    void this.itemStore.loadItems(
      q
        ? { where: { name: { ilike: `%${q}%` } }, includes: ['category'] }
        : { includes: ['category'] },
    );
  }

  async selectItem(item: Item, rowIndex: number): Promise<void> {
    this.activeItemRowIndex.set(-1);
    this.itemSearch.set('');
    this.items.update((rows) =>
      rows.map((row, i) =>
        i === rowIndex
          ? { ...row, item, itemid: item.id ?? '', name: item.name, code: item.code ?? '' }
          : row,
      ),
    );

    const enrichedItem = await this.withFetchedCategory(item);
    const taxes = await this.buildTaxesForItem(enrichedItem, this.taxoption());

    this.items.update((rows) =>
      rows.map((row, i) => {
        if (i !== rowIndex || row.itemid !== (item.id ?? '')) return row;

        return this.calcRow({
          ...row,
          item: enrichedItem,
          itemid: enrichedItem.id ?? '',
          name: enrichedItem.name,
          code: enrichedItem.code ?? '',
          taxes,
        });
      }),
    );
  }

  closeItemDropdown(): void {
    this.activeItemRowIndex.set(-1);
  }

  setShowDiscount(value: boolean): void {
    this.showDiscount.set(value);
    this.items.update((rows) => rows.map((row) => this.calcRow(row)));
  }

  getItemDisplayName(row: ItemRow): string {
    return row.item?.displayname ?? row.item?.name ?? row.name ?? '';
  }

  quantityForRow(row: ItemRow): number {
    return this.showQty1Value(row);
  }

  updateItemField(
    rowIndex: number,
    field: 'price' | 'quantity1' | 'quantity2' | 'discpercent',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, [field]: num } : row)),
    );
  }

  updateItemFieldAndRecalc(
    rowIndex: number,
    field: 'price' | 'quantity1' | 'quantity2' | 'discpercent',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? this.calcRow({ ...row, [field]: num }) : row)),
    );
  }

  updateItemDescription(rowIndex: number, value: string | null): void {
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, description: value ?? '' } : row)),
    );
  }

  recalcRow(rowIndex: number): void {
    this.items.update((rows) => rows.map((row, i) => (i === rowIndex ? this.calcRow(row) : row)));
  }

  addItemRow(): void {
    this.items.update((rows) => [...rows, this.emptyItemRow(this.taxColumnCount())]);
  }

  removeItemRow(index: number): void {
    if (this.items().length > 1) {
      this.items.update((rows) => rows.filter((_, i) => i !== index));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private buildTaxes(item: Item, taxOption: string): TaxRow[] {
    type ItemWithCat = Item & { category?: { taxgroupid?: string } };
    const taxGroupId = (item as ItemWithCat).category?.taxgroupid;
    if (!taxGroupId || !taxOption) return [];

    const tg = this.taxGroupStore.items().find((g) => g.id === taxGroupId);
    if (!tg) return [];

    const group = tg?.groups?.find((g) => g.mode === taxOption);
    if (!group) return [];

    return this.taxIdsForMode(tg, taxOption).map((taxId) => {
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
    this.items.update((rows) => rows.map((row, i) => (i === rowIndex ? { ...row, taxes } : row)));
  }

  private async withFetchedCategory(item: Item): Promise<Item> {
    const categoryId = item.categoryid || item.category?.id;
    if (!categoryId) return item;

    const category =
      (await this.itemCategoryStore.loadItemCategoryById(categoryId, {
        includes: ['taxgroup'],
      })) ??
      item.category ??
      null;

    return category ? { ...item, category } : item;
  }

  private async buildTaxesForItem(item: Item, taxOption: string): Promise<TaxRow[]> {
    const category = item.category ?? (await this.fetchItemCategory(item));
    const taxGroup = category ? await this.fetchTaxGroup(category) : null;
    if (!taxGroup || !taxOption) return [];

    const taxIds = this.taxIdsForMode(taxGroup, taxOption);
    const taxes = await Promise.all(taxIds.map((taxId) => this.fetchTax(taxId)));

    return taxes.map((tax, index) => {
      const taxId = taxIds[index] ?? tax?.id ?? '';
      return {
        taxid: tax?.id ?? taxId,
        name: tax?.name ?? '',
        shortname: tax?.shortname ?? taxId.slice(0, 4),
        rate: tax?.rate ?? 0,
        appliedto: tax?.appliedto ?? 100,
        amount: 0,
      };
    });
  }

  private async fetchItemCategory(item: Item): Promise<ItemCategory | null> {
    const categoryId = item.categoryid || item.category?.id;
    if (!categoryId) return item.category ?? null;

    return (
      (await this.itemCategoryStore.loadItemCategoryById(categoryId, {
        includes: ['taxgroup'],
      })) ??
      item.category ??
      null
    );
  }

  private async fetchTaxGroup(category: ItemCategory): Promise<TaxGroup | null> {
    if (category.taxgroup?.groups?.length) {
      return category.taxgroup;
    }

    const taxGroupId = category.taxgroupid || category.taxgroup?.id;
    if (!taxGroupId) return null;

    return (
      this.taxGroupStore.items().find((taxGroup) => taxGroup.id === taxGroupId) ??
      (await this.taxGroupStore.loadTaxGroupById(taxGroupId))
    );
  }

  private async fetchTax(taxId: string): Promise<Tax | null> {
    return (
      this.taxStore.items().find((tax) => tax.id === taxId) ?? this.taxStore.loadTaxById(taxId)
    );
  }

  private taxIdsForMode(taxGroup: TaxGroup, taxOption: string): readonly string[] {
    const group = taxGroup.groups?.find((currentGroup) => currentGroup.mode === taxOption);
    return group?.taxids ?? group?.taxes ?? [];
  }

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = toNum(this.quantityForRow(row)) || 1;
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

    return {
      ...row,
      itemtotal,
      discamount,
      subtotal,
      taxamount,
      grandtotal: subtotal + taxamount,
      taxes,
    };
  }

  private emptyTaxRow(): TaxRow {
    return { taxid: '', name: '', shortname: '', rate: 0, appliedto: 100, amount: 0 };
  }

  private emptyItemRow(taxCount = 0): ItemRow {
    return {
      item: null,
      itemid: '',
      name: '',
      code: '',
      description: '',
      price: 0,
      quantity1: 1,
      quantity2: 1,
      itemtotal: 0,
      discpercent: 0,
      discamount: 0,
      subtotal: 0,
      taxamount: 0,
      grandtotal: 0,
      taxes: Array.from({ length: taxCount }, () => this.emptyTaxRow()),
    };
  }

  private showQty1Value(row: ItemRow): number {
    return this.taxoption() !== 'Intra State' &&
      this.taxoption() !== 'Inter State' &&
      !this.showDiscount()
      ? row.quantity1
      : row.quantity2;
  }
}
