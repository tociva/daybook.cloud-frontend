import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { ParamMap } from '@angular/router';
import dayjs from 'dayjs';
import type { Vendor } from '../../../data/vendor';
import { VendorStore } from '../../../data/vendor';
import type { Item } from '../../../data/item';
import { ItemStore } from '../../../data/item';
import type { ItemCategory } from '../../../data/item-category';
import { ItemCategoryStore } from '../../../data/item-category';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import type { Tax } from '../../../data/tax';
import { TaxStore } from '../../../data/tax';
import type { TaxGroup } from '../../../data/tax-group';
import { TaxGroupStore } from '../../../data/tax-group';
import { FiscalYearDateRangeService } from '../../../../../../shared/fiscal-year-date-range-picker';
import {
  DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS,
  DEFAULT_NODE_DATE_FORMAT,
} from '../../../../../../util/constants';

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
export class PurchaseInvoiceDraftStore {
  private vendorSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private itemSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly vendorStore = inject(VendorStore);
  private readonly itemStore = inject(ItemStore);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);

  // ── Submission flag ───────────────────────────────────────────────────────

  readonly submitted = signal(false);

  // ── Invoice detail signals ────────────────────────────────────────────────

  readonly number = signal('');
  readonly date = signal(this.fiscalYearDateRange.defaultDate());
  readonly duedate = signal(this.getDefaultDueDate(this.date()));
  readonly currencycode = signal('INR');
  readonly taxoption = signal('Intra State');
  readonly description = signal('');

  // ── Vendor / address signals ──────────────────────────────────────────────

  readonly vendorid = signal('');
  readonly selectedVendor = signal<Vendor | null>(null);
  readonly vendorSearch = signal('');

  readonly vendorAddressName = signal('');
  readonly vendorAddressLine1 = signal('');
  readonly vendorAddressLine2 = signal('');
  readonly vendorAddressCity = signal('');
  readonly vendorAddressState = signal('');
  readonly vendorAddressZip = signal('');
  readonly vendorAddressCountry = signal('');

  // ── Line item signals ─────────────────────────────────────────────────────

  readonly items = signal<ItemRow[]>([this.emptyItemRow()]);
  readonly roundoff = signal('0');
  readonly showDiscount = signal(false);
  readonly showDescription = signal(false);
  readonly activeItemRowIndex = signal(-1);
  readonly itemSearch = signal('');

  /**
   * True when the store currently holds the full, unfiltered item list
   * (i.e. the last loadItems call used an empty query). Flipped to false
   * whenever a non-empty search overwrites the store with filtered results.
   */
  private emptyItemsLoaded = false;

  // ── Tax-mode options ──────────────────────────────────────────────────────

  readonly taxModeOptions = computed<SelectOption[]>(() => {
    const seen = new Set<string>(['Intra State', 'Inter State', 'Export', 'Non Taxable']);
    for (const tg of this.taxGroupStore.items()) {
      for (const g of tg.groups ?? []) {
        if (g.mode) seen.add(g.mode);
      }
    }
    return Array.from(seen).map((m) => ({ label: m, value: m }));
  });

  // ── Filtered lists ────────────────────────────────────────────────────────

  readonly filteredVendors = computed<Vendor[]>(() => {
    const list = this.vendorStore.items() as Vendor[];
    return list.slice(0, 15);
  });

  readonly filteredItems = computed<Item[]>(() => {
    const list = this.itemStore.items() as Item[];
    return list.slice(0, 15);
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

  readonly vendorError = computed(() =>
    this.submitted() && !this.vendorid() ? 'Vendor is required.' : null,
  );
  readonly numberError = computed(() =>
    this.submitted() && !this.number() ? 'Number is required.' : null,
  );
  readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.date()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.date());
  });

  /**
   * The date signal is initialised before the fiscal-year range may be available.
   * Once it arrives, keep the invoice date inside the fiscal year and keep the
   * initial due date aligned to invoice date + 14 days.
   */
  private readonly _fiscalYearDateEffect = effect(() => {
    const range = this.fiscalYearDateRange.range();
    if (!range) return;

    untracked(() => {
      const current = this.date();
      const constrained = this.fiscalYearDateRange.defaultDate(current);
      if (constrained !== current) {
        this.date.set(constrained);
        this.duedate.set(this.getDefaultDueDate(constrained));
      }
    });
  });

  // ── Patch from loaded invoice (edit / view mode) ──────────────────────────

  patchFromInvoice(inv: PurchaseInvoice): void {
    const cprops = inv.cprops;

    this.number.set(inv.number ?? '');
    this.date.set(inv.date ?? '');
    this.duedate.set(inv.duedate ?? '');
    this.currencycode.set(inv.currencycode ?? inv.currency?.code ?? 'INR');
    this.taxoption.set(cprops?.taxoption ?? 'Intra State');
    this.description.set(inv.description ?? '');
    this.vendorid.set(inv.vendorid ?? inv.vendor?.id ?? '');
    this.showDiscount.set(cprops?.showdiscount ?? false);
    this.showDescription.set(cprops?.showdescription ?? false);

    if (inv.vendor) {
      this.selectedVendor.set(inv.vendor as Vendor);
      this.vendorSearch.set(inv.vendor.name ?? '');
    }

    const a = inv.vendoraddress;
    this.vendorAddressName.set(a?.name ?? '');
    this.vendorAddressLine1.set(a?.line1 ?? '');
    this.vendorAddressLine2.set(a?.line2 ?? '');
    this.vendorAddressCity.set(a?.city ?? '');
    this.vendorAddressState.set(a?.state ?? '');
    this.vendorAddressZip.set(a?.zip ?? '');
    this.vendorAddressCountry.set(a?.country ?? '');

    this.roundoff.set(String(inv.roundoff ?? 0));

    this.items.set(
      (inv.items ?? []).map((pi) => ({
        item: (pi.item as Item) ?? null,
        itemid: pi.itemid ?? pi.item?.id ?? '',
        name: pi.name,
        code: pi.code,
        description: pi.description ?? '',
        price: pi.price,
        quantity: pi.quantity,
        itemtotal: pi.itemtotal,
        discpercent: pi.discpercent ?? 0,
        discamount: pi.discamount ?? 0,
        subtotal: pi.subtotal,
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

  patchFromGstReconciliation(query: ParamMap): void {
    const invoiceNumber = query.get('invoiceNumber')?.trim() ?? '';
    const invoiceDate = this.normalizeInvoiceDate(query.get('invoiceDate'));
    const partyName = query.get('partyName')?.trim() ?? '';
    const partyGstin = query.get('partyGstin')?.trim() ?? '';
    const taxableValue = this.queryNumber(query, 'taxableValue');
    const totalTax = this.queryNumber(query, 'totalTax');
    const invoiceValue = this.queryNumber(query, 'invoiceValue');
    const igst = this.queryNumber(query, 'igst');
    const cgst = this.queryNumber(query, 'cgst');
    const sgst = this.queryNumber(query, 'sgst');

    if (!invoiceNumber && !invoiceDate && !partyName && !partyGstin && invoiceValue === 0) {
      return;
    }

    this.number.set(invoiceNumber || this.number());
    if (invoiceDate) {
      this.date.set(invoiceDate);
      this.duedate.set(this.getDefaultDueDate(invoiceDate));
    }

    const vendor = this.findVendorForGstParty(partyGstin, partyName);
    if (vendor) {
      this.selectVendor(vendor);
    } else if (partyName || partyGstin) {
      this.selectedVendor.set(null);
      this.vendorid.set('');
      this.vendorSearch.set(partyName || partyGstin);
      this.vendorAddressName.set(partyName || this.vendorAddressName());
    }

    const descriptionParts = [
      'Created from GST reconciliation.',
      partyName ? `Party: ${partyName}.` : '',
      partyGstin ? `GSTIN: ${partyGstin}.` : '',
    ].filter(Boolean);
    this.description.set(descriptionParts.join(' '));
    this.showDescription.set(false);

    if (taxableValue || totalTax || invoiceValue) {
      const taxableBase = taxableValue || Math.max(invoiceValue - totalTax, 0) || invoiceValue;
      const taxes = this.buildGstReconciliationTaxes({
        taxableValue: taxableBase,
        totalTax,
        igst,
        cgst,
        sgst,
      });
      this.taxoption.set(igst > 0 ? 'Inter State' : 'Intra State');
      this.items.set([
        {
          ...this.emptyItemRow(taxes.length),
          name: invoiceNumber ? `GST invoice ${invoiceNumber}` : 'GST invoice',
          description: '',
          price: taxableBase,
          quantity: 1,
          itemtotal: taxableBase,
          subtotal: taxableBase,
          taxamount: totalTax,
          grandtotal: invoiceValue || taxableBase + totalTax,
          taxes,
        },
      ]);
    }
  }

  // ── Vendor methods ────────────────────────────────────────────────────────

  onVendorSearchInput(value: string | null): void {
    const q = (value ?? '').trim();
    this.vendorSearch.set(q);
    if (!q) {
      this.selectedVendor.set(null);
      this.vendorid.set('');
    }
    if (this.vendorSearchTimer) clearTimeout(this.vendorSearchTimer);
    this.vendorSearchTimer = setTimeout(() => {
      void this.vendorStore.loadVendors(
        q
          ? {
              where: {
                or: [
                  { name: { ilike: `%${q}%` } },
                  { mobile: { ilike: `%${q}%` } },
                  { email: { ilike: `%${q}%` } },
                ],
              },
            }
          : {},
      );
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  selectVendor(vendor: Vendor): void {
    this.selectedVendor.set(vendor);
    this.vendorSearch.set(vendor.name);
    this.vendorid.set(vendor.id ?? '');
    this.currencycode.set(vendor.currencycode ?? this.currencycode());
    this.vendorAddressName.set(vendor.address?.name ?? vendor.name);
    this.vendorAddressLine1.set(vendor.address?.line1 ?? '');
    this.vendorAddressLine2.set(vendor.address?.line2 ?? '');
    this.vendorAddressCity.set(vendor.address?.city ?? '');
    this.vendorAddressState.set(vendor.address?.state ?? '');
    this.vendorAddressZip.set(vendor.address?.zip ?? '');
    this.vendorAddressCountry.set(vendor.address?.country ?? '');
  }

  // ── Invoice detail methods ────────────────────────────────────────────────

  onDateChange(value: unknown): void {
    let newDate = '';
    if (typeof value === 'string') newDate = value;
    else if (dayjs.isDayjs(value) && value.isValid())
      newDate = value.format(DEFAULT_NODE_DATE_FORMAT);
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      newDate = dayjs(value).format(DEFAULT_NODE_DATE_FORMAT);

    if (!newDate) return;
    this.date.set(newDate);
    this.duedate.set(this.getDefaultDueDate(newDate));
  }

  onDueDateChange(value: unknown): void {
    if (typeof value === 'string') this.duedate.set(value);
    else if (dayjs.isDayjs(value) && value.isValid())
      this.duedate.set(value.format(DEFAULT_NODE_DATE_FORMAT));
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      this.duedate.set(dayjs(value).format(DEFAULT_NODE_DATE_FORMAT));
  }

  onTaxOptionChange(value: string | null): void {
    const opt = value ?? 'Intra State';
    this.taxoption.set(opt);
    void this.rebuildTaxesForRows(opt);
  }

  // ── Item methods ──────────────────────────────────────────────────────────

  onItemSearchInput(value: string | null, rowIndex: number): void {
    const q = (value ?? '').trim();
    this.itemSearch.set(q);
    this.activeItemRowIndex.set(rowIndex);

    if (this.itemSearchTimer) clearTimeout(this.itemSearchTimer);
    this.itemSearchTimer = setTimeout(() => {
      if (q) {
        // Typed search: hit the server with a filter and mark the cache as stale.
        this.emptyItemsLoaded = false;
        void this.itemStore.loadItems({
          where: {
            or: [
              { name: { ilike: `%${q}%` } },
              { code: { ilike: `%${q}%` } },
              { displayname: { ilike: `%${q}%` } },
            ],
          },
          includes: ['category'],
        });
      } else if (!this.emptyItemsLoaded) {
        // Empty query and no cached full list yet: fetch all items and cache.
        void this.itemStore.loadItems({ includes: ['category'] }).then(() => {
          this.emptyItemsLoaded = true;
        });
      }
      // else: empty query + full list already in store → no network call needed.
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  /**
   * Signals that the full unfiltered item list has already been loaded into
   * the ItemStore (e.g. by the parent component's initial load), so the first
   * autocomplete focus does not trigger a redundant network request.
   */
  markAllItemsLoaded(): void {
    this.emptyItemsLoaded = true;
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
    this.ensureTrailingEmptyRow();
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

  updateItemField(
    rowIndex: number,
    field: 'price' | 'quantity' | 'discpercent',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? { ...row, [field]: num } : row)),
    );
  }

  updateItemFieldAndRecalc(
    rowIndex: number,
    field: 'price' | 'quantity' | 'discpercent',
    value: string | null,
  ): void {
    const num = toNum(value ?? '');
    this.items.update((rows) =>
      rows.map((row, i) => (i === rowIndex ? this.calcRow({ ...row, [field]: num }) : row)),
    );
    this.ensureTrailingEmptyRow();
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

  private async withFetchedCategory(item: Item): Promise<Item> {
    const categoryId = item.categoryid || item.category?.id;
    if (!categoryId) return item;

    const category =
      (await this.itemCategoryStore.loadItemCategoryById(categoryId, {
        includes: ['parent', 'taxgroup'],
      })) ??
      item.category ??
      null;

    return category ? { ...item, category } : item;
  }

  private async buildTaxesForItem(item: Item, taxOption: string): Promise<TaxRow[]> {
    if (!taxOption) return [];

    const category = item.category ?? (await this.fetchItemCategory(item));
    const taxGroup = category ? await this.findNearestTaxGroup(category, taxOption) : null;
    if (!taxGroup) return [];

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
        includes: ['parent', 'taxgroup'],
      })) ??
      item.category ??
      null
    );
  }

  private async rebuildTaxesForRows(taxOption: string): Promise<void> {
    const taxesByItemId = new Map(
      await Promise.all(
        this.items().map(async (row) => [
          row.itemid,
          row.item ? await this.buildTaxesForItem(row.item, taxOption) : [],
        ] as const),
      ),
    );

    if (this.taxoption() !== taxOption) return;

    this.items.update((rows) =>
      rows.map((row) =>
        this.calcRow({
          ...row,
          taxes: row.item ? (taxesByItemId.get(row.itemid) ?? []) : [],
        }),
      ),
    );
  }

  private async findNearestTaxGroup(
    category: ItemCategory,
    taxOption: string,
    visited = new Set<string>(),
  ): Promise<TaxGroup | null> {
    const categoryId = category.id;
    if (categoryId) {
      if (visited.has(categoryId)) return null;
      visited.add(categoryId);
    }

    const taxGroup = await this.fetchTaxGroup(category);
    if (taxGroup && this.taxIdsForMode(taxGroup, taxOption).length > 0) {
      return taxGroup;
    }

    const parent = await this.fetchParentCategory(category);
    return parent ? this.findNearestTaxGroup(parent, taxOption, visited) : null;
  }

  private async fetchParentCategory(category: ItemCategory): Promise<ItemCategory | null> {
    const parentId = category.parentid || category.parent?.id;
    if (!parentId) return category.parent ?? null;

    const cachedParent =
      category.parent && category.parent.id === parentId ? category.parent : undefined;
    if (cachedParent?.taxgroup && cachedParent.parent) {
      return cachedParent;
    }

    return (
      (await this.itemCategoryStore.loadItemCategoryById(parentId, {
        includes: ['parent', 'taxgroup'],
      })) ??
      cachedParent ??
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

  private findVendorForGstParty(gstin: string, name: string): Vendor | null {
    const normalizedGstin = this.normalizeComparable(gstin);
    const normalizedName = this.normalizeComparable(name);

    return (
      (this.vendorStore.items() as Vendor[]).find((vendor) => {
        const vendorGstin = this.normalizeComparable(vendor.gstin ?? '');
        const vendorName = this.normalizeComparable(vendor.name ?? '');
        return (
          (normalizedGstin && vendorGstin === normalizedGstin) ||
          (!normalizedGstin && normalizedName && vendorName === normalizedName)
        );
      }) ?? null
    );
  }

  private normalizeComparable(value: string): string {
    return value.trim().toLowerCase();
  }

  private queryNumber(query: ParamMap, key: string): number {
    return toNum(query.get(key));
  }

  private buildGstReconciliationTaxes(values: {
    taxableValue: number;
    totalTax: number;
    igst: number;
    cgst: number;
    sgst: number;
  }): TaxRow[] {
    const taxableValue = values.taxableValue || 0;
    if (!taxableValue) return [];

    if (values.igst > 0) {
      return [
        {
          taxid: '',
          name: 'IGST',
          shortname: 'IGST',
          rate: this.taxRate(values.igst, taxableValue),
          appliedto: taxableValue,
          amount: values.igst,
        },
      ];
    }

    const splitTax = values.totalTax > 0 ? values.totalTax / 2 : 0;
    const cgst = splitTax || values.cgst;
    const sgst = splitTax || values.sgst;
    return [
      {
        taxid: '',
        name: 'CGST',
        shortname: 'CGST',
        rate: this.taxRate(cgst, taxableValue),
        appliedto: taxableValue,
        amount: cgst,
      },
      {
        taxid: '',
        name: 'SGST',
        shortname: 'SGST',
        rate: this.taxRate(sgst, taxableValue),
        appliedto: taxableValue,
        amount: sgst,
      },
    ].filter((tax) => tax.amount > 0);
  }

  private taxRate(amount: number, taxableValue: number): number {
    if (!taxableValue) return 0;
    return Number(((amount / taxableValue) * 100).toFixed(2));
  }

  private normalizeInvoiceDate(value: string | null): string {
    const date = value?.trim();
    if (!date) return '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;

    const slashOrDash = date.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (slashOrDash) {
      const [, dd, mm, rawYear] = slashOrDash;
      const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
      return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    const parsed = dayjs(date);
    return parsed.isValid() ? parsed.format(DEFAULT_NODE_DATE_FORMAT) : '';
  }

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = Math.max(1, toNum(row.quantity));
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

  /**
   * Ensures exactly one trailing empty row exists whenever at least one row has
   * a valid grand total. Collapses multiple trailing empty rows down to one,
   * and appends one if the last row is filled.
   */
  private ensureTrailingEmptyRow(): void {
    this.items.update((rows) => {
      const isEmptyRow = (row: ItemRow) => !row.itemid && row.grandtotal === 0;

      // Only act when at least one row has a valid grand total.
      const hasValidTotal = rows.some((r) => r.grandtotal > 0);
      if (!hasValidTotal) return rows;

      // Count consecutive empty rows at the tail.
      let trailingEmpty = 0;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (isEmptyRow(rows[i])) trailingEmpty++;
        else break;
      }

      // No trailing empty row → append one.
      if (trailingEmpty === 0) {
        return [...rows, this.emptyItemRow(this.taxColumnCount())];
      }

      // More than one trailing empty row → collapse to a single empty row.
      if (trailingEmpty > 1) {
        return rows.slice(0, rows.length - trailingEmpty + 1);
      }

      // Exactly one trailing empty row — nothing to change.
      return rows;
    });
  }

  private emptyTaxRow(): TaxRow {
    return { taxid: '', name: '', shortname: '', rate: 0, appliedto: 100, amount: 0 };
  }

  private getDefaultDueDate(date: string): string {
    return dayjs(date).add(14, 'day').format(DEFAULT_NODE_DATE_FORMAT);
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
      discpercent: 0,
      discamount: 0,
      subtotal: 0,
      taxamount: 0,
      grandtotal: 0,
      taxes: Array.from({ length: taxCount }, () => this.emptyTaxRow()),
    };
  }
}
