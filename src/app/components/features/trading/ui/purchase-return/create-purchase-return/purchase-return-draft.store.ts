import { Injectable, computed, inject, signal } from '@angular/core';
import dayjs from 'dayjs';
import type { Item } from '../../../data/item';
import { ItemStore } from '../../../data/item';
import type { ItemCategory } from '../../../data/item-category';
import { ItemCategoryStore } from '../../../data/item-category';
import type { PurchaseReturn } from '../../../data/purchase-return';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import { PurchaseInvoiceStore } from '../../../data/purchase-invoice';
import type { Tax } from '../../../data/tax';
import { TaxStore } from '../../../data/tax';
import type { TaxGroup } from '../../../data/tax-group';
import { TaxGroupStore } from '../../../data/tax-group';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-datepicker';
import { DEFAULT_NODE_DATE_FORMAT } from '../../../../../../util/constants';

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
  quantity: number;
  itemtotal: number;
  taxamount: number;
  grandtotal: number;
  taxes: TaxRow[];
  description: string;
}

export type SelectOption = Readonly<{ label: string; value: string }>;

// ── Draft Store ───────────────────────────────────────────────────────────────

@Injectable()
export class PurchaseReturnDraftStore {
  private readonly itemStore = inject(ItemStore);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  // ── Submission flag ───────────────────────────────────────────────────────

  readonly submitted = signal(false);

  // ── Return detail signals ─────────────────────────────────────────────────

  readonly number = signal('');
  readonly date = signal(this.fiscalYearDateRange.defaultDate());
  readonly duedate = signal(dayjs().add(7, 'day').format(DEFAULT_NODE_DATE_FORMAT));
  readonly taxoption = signal('Intra State');
  readonly description = signal('');

  // ── Purchase Invoice reference signals ───────────────────────────────────

  readonly purchaseinvoiceid = signal('');
  readonly selectedPurchaseInvoice = signal<PurchaseInvoice | null>(null);
  readonly invoiceSearch = signal('');

  // ── Line item signals ─────────────────────────────────────────────────────

  readonly items = signal<ItemRow[]>([this.emptyItemRow()]);
  readonly roundoff = signal('0');
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

  readonly filteredInvoices = computed<PurchaseInvoice[]>(() => {
    const q = this.invoiceSearch().toLowerCase();
    const list = this.purchaseInvoiceStore.items() as PurchaseInvoice[];
    return (
      q
        ? list.filter(
            (inv) =>
              inv.number?.toLowerCase().includes(q) ||
              inv.vendor?.name?.toLowerCase().includes(q),
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
  readonly tax = computed(() => fmt(this.items().reduce((s, r) => s + r.taxamount, 0)));
  readonly grandtotal = computed(() =>
    fmt(this.items().reduce((s, r) => s + r.grandtotal, 0) + toNum(this.roundoff())),
  );

  // ── Validation ────────────────────────────────────────────────────────────

  readonly invoiceError = computed(() =>
    this.submitted() && !this.purchaseinvoiceid() ? 'Purchase invoice is required.' : null,
  );
  readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.date()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.date());
  });

  // ── Patch from loaded return (edit / view mode) ───────────────────────────

  patchFromReturn(ret: PurchaseReturn): void {
    const cprops = ret.cprops;

    this.number.set(ret.number ?? '');
    this.date.set(ret.date ?? '');
    this.duedate.set(ret.duedate ?? '');
    this.taxoption.set(cprops?.taxoption ?? 'Intra State');
    this.description.set(ret.description ?? '');
    this.purchaseinvoiceid.set(ret.purchaseinvoiceid ?? ret.purchaseinvoice?.id ?? '');
    this.showDescription.set(cprops?.showdescription ?? false);

    if (ret.purchaseinvoice) {
      const inv = ret.purchaseinvoice as PurchaseInvoice;
      this.selectedPurchaseInvoice.set(inv);
      this.invoiceSearch.set(inv.number ?? '');
    }

    this.roundoff.set(String(ret.roundoff ?? 0));

    // Only update line items when they are explicitly included in the response.
    // The list query omits items, so patching from a cached list entry must not
    // clear the table to an empty array; the full detail response (which does
    // include items) will populate it once the API call completes.
    if (ret.items !== undefined) {
      this.items.set(
        ret.items.map((ri) => ({
          item: (ri.item as Item) ?? null,
          itemid: ri.itemid ?? ri.item?.id ?? '',
          name: ri.name,
          code: ri.code,
          description: ri.description ?? '',
          price: ri.price,
          quantity: ri.quantity,
          itemtotal: ri.itemtotal,
          taxamount: ri.taxamount ?? 0,
          grandtotal: ri.grandtotal,
          taxes: (ri.taxes ?? []).map((t) => ({
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
  }

  // ── Invoice methods ───────────────────────────────────────────────────────

  onInvoiceSearchInput(value: string | null): void {
    const q = value ?? '';
    this.invoiceSearch.set(q);
    if (!q) {
      this.selectedPurchaseInvoice.set(null);
      this.purchaseinvoiceid.set('');
    }
    void this.purchaseInvoiceStore.loadPurchaseInvoices(
      q ? { where: { number: { ilike: `%${q}%` } }, includes: ['vendor'] } : { includes: ['vendor'] },
    );
  }

  selectInvoice(invoice: PurchaseInvoice): void {
    this.selectedPurchaseInvoice.set(invoice);
    this.invoiceSearch.set(invoice.number ?? '');
    this.purchaseinvoiceid.set(invoice.id ?? '');

    // Pre-fill line items from the invoice's items if available
    if (invoice.items?.length) {
      this.items.set(
        invoice.items.map((pi) => ({
          item: (pi.item as Item) ?? null,
          itemid: pi.itemid ?? pi.item?.id ?? '',
          name: pi.name,
          code: pi.code,
          description: pi.description ?? '',
          price: pi.price,
          quantity: pi.quantity,
          itemtotal: pi.itemtotal,
          taxamount: pi.taxamount ?? 0,
          grandtotal: pi.grandtotal,
          taxes: (pi.taxes ?? []).map((t) => ({
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
  }

  // ── Return detail methods ─────────────────────────────────────────────────

  onDateChange(value: unknown): void {
    let newDate = '';
    if (typeof value === 'string') newDate = value;
    else if (dayjs.isDayjs(value) && value.isValid()) newDate = value.format(DEFAULT_NODE_DATE_FORMAT);
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      newDate = dayjs(value).format(DEFAULT_NODE_DATE_FORMAT);

    if (!newDate) return;
    this.date.set(newDate);

    if (this.duedate() && dayjs(this.duedate()).isBefore(dayjs(newDate))) {
      this.duedate.set(newDate);
    }
  }

  onDueDateChange(value: unknown): void {
    if (typeof value === 'string') this.duedate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid()) this.duedate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.duedate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
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

  getItemDisplayName(row: ItemRow): string {
    return row.item?.displayname ?? row.item?.name ?? row.name ?? '';
  }

  updateItemField(
    rowIndex: number,
    field: 'price' | 'quantity',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, [field]: num } : row)),
    );
  }

  updateItemFieldAndRecalc(
    rowIndex: number,
    field: 'price' | 'quantity',
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
    const group = taxGroup.groups?.find((g) => g.mode === taxOption);
    return group?.taxids ?? group?.taxes ?? [];
  }

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = Math.max(1, toNum(row.quantity));
    const itemtotal = price * quantity;

    let taxamount = 0;
    const taxes = row.taxes.map((t) => {
      const amount = (itemtotal * toNum(t.rate)) / 100;
      taxamount += amount;
      return { ...t, amount };
    });

    return {
      ...row,
      itemtotal,
      taxamount,
      grandtotal: itemtotal + taxamount,
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
      quantity: 1,
      itemtotal: 0,
      taxamount: 0,
      grandtotal: 0,
      taxes: Array.from({ length: taxCount }, () => this.emptyTaxRow()),
    };
  }
}
