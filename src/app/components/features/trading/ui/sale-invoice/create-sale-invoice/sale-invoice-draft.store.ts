import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import type { ParamMap } from '@angular/router';
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
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
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

export function roundAmount(n: number, dec = 2): number {
  const factor = 10 ** dec;
  return Math.round((n + Number.EPSILON) * factor) / factor;
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

interface SaleInvoiceDraftSnapshot {
  autoNumbering: boolean;
  numberEnabled: boolean;
  number: string;
  date: string;
  duedate: string;
  currencycode: string;
  conversionrate: string;
  taxoption: string;
  deliverystate: string;
  customerid: string;
  selectedCustomer: Customer | null;
  customerSearch: string;
  useBillingForShipping: boolean;
  billingName: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingCountry: string;
  roundoff: string;
  showDiscount: boolean;
  showDescription: boolean;
  items: ItemRow[];
  /** Row index into which a newly-created item should be auto-selected on return. */
  pendingItemRowIndex: number | null;
}

// ── Draft Store ───────────────────────────────────────────────────────────────

@Injectable()
export class SaleInvoiceDraftStore {
  private customerSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private itemSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly customerStore = inject(CustomerStore);
  private readonly itemStore = inject(ItemStore);
  private readonly itemCategoryStore = inject(ItemCategoryStore);
  private readonly taxGroupStore = inject(TaxGroupStore);
  private readonly taxStore = inject(TaxStore);
  private readonly userSession = inject(UserSessionStore);
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
  readonly duedate = signal(dayjs().add(14, 'day').format(DEFAULT_NODE_DATE_FORMAT));
  readonly currencycode = signal('INR');
  readonly conversionrate = signal('1');
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

  /**
   * True when the store currently holds the full, unfiltered item list
   * (i.e. the last loadItems call used an empty query).  Flipped to false
   * whenever a non-empty search overwrites the store with filtered results.
   */
  private emptyItemsLoaded = false;

  // ── Tax-mode options ──────────────────────────────────────────────────────

  readonly taxModeOptions = computed<SelectOption[]>(() => {
    const seen = new Set<string>(['Intra State', 'Inter State', 'Export', 'Non Taxable']);
    for (const tg of this.taxGroupStore.catalog()) {
      for (const g of tg.groups ?? []) {
        if (g.mode) seen.add(g.mode);
      }
    }
    return Array.from(seen).map((m) => ({ label: m, value: m }));
  });

  // ── Filtered lists ────────────────────────────────────────────────────────

  readonly filteredCustomers = computed<Customer[]>(() => {
    const list = this.customerStore.items() as Customer[];
    return list.slice(0, 15);
  });

  readonly filteredItems = computed<Item[]>(() => {
    const list = this.itemStore.items() as Item[];
    return list.slice(0, 15);
  });

  // ── Tax column computed ───────────────────────────────────────────────────

  readonly taxColumnCount = computed<number>(() => {
    const opt = this.taxoption();
    for (const tg of this.taxGroupStore.catalog()) {
      for (const g of tg.groups ?? []) {
        if (g.mode === opt) return (g.taxids ?? []).length;
      }
    }
    return 0;
  });

  readonly taxColumns = computed<{ name: string; shortname: string }[]>(() => {
    const opt = this.taxoption();
    for (const tg of this.taxGroupStore.catalog()) {
      for (const g of tg.groups ?? []) {
        if (g.mode === opt && (g.taxids ?? []).length > 0) {
          return (g.taxids ?? []).map((taxId) => {
            const tax = this.taxStore.catalog().find((t) => t.id === taxId);
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

  readonly branchCurrencyCode = computed(() => this.userSession.session()?.branch?.currencycode ?? '');
  readonly showConversionRate = computed(() => {
    const branchCurrency = this.branchCurrencyCode();
    const invoiceCurrency = this.currencycode();
    return !!branchCurrency && !!invoiceCurrency && invoiceCurrency !== branchCurrency;
  });

  // ── Validation ────────────────────────────────────────────────────────────

  readonly customerError = computed(() =>
    this.submitted() && !this.customerid() ? 'Customer is required.' : null,
  );
  readonly dateError = computed(() => {
    if (!this.submitted()) return null;
    if (!this.date()) return 'Date is required.';
    return this.fiscalYearDateRange.errorMessage(this.date());
  });
  readonly conversionRateError = computed(() => {
    if (!this.showConversionRate()) return null;

    const value = this.conversionrate().trim();
    if (!value) return 'Conversion rate is required.';

    const rate = Number(value);
    return Number.isFinite(rate) && rate > 0
      ? null
      : 'Conversion rate must be greater than 0.';
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

  /**
   * The date signal is initialised before the fiscal-year range loads (range()
   * is null at construction time), so defaultDate() falls back to "today"
   * without constraining to the fiscal year.  Once the range arrives this
   * effect re-checks the current date and clamps it into the valid range so
   * the datepicker and the signal stay in sync.
   *
   * untracked() is used to read this.date() so the effect only re-runs when
   * the fiscal-year range changes, not on every date edit by the user.
   */
  private readonly _fiscalYearDateEffect = effect(() => {
    const range = this.fiscalYearDateRange.range();
    if (!range) return;

    untracked(() => {
      const current = this.date();
      const constrained = this.fiscalYearDateRange.defaultDate(current);
      if (constrained !== current) {
        this.date.set(constrained);
      }
    });
  });

  // ── Patch from loaded invoice (edit mode) ─────────────────────────────────

  patchFromInvoice(inv: SaleInvoice): void {
    const cprops = inv.cprops;

    this.invoiceNumber.set(inv.number ?? '');
    this.number.set(inv.number ?? '');
    this.date.set(inv.date ?? '');
    this.duedate.set(inv.duedate ?? '');
    this.currencycode.set(inv.currencycode ?? inv.currency?.code ?? 'INR');
    this.conversionrate.set(String(cprops?.fx ?? 1));
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

  patchFromGstReconciliation(query: ParamMap): void {
    const invoiceNumber = query.get('invoiceNumber')?.trim() ?? '';
    const invoiceDate = this.normalizeInvoiceDate(query.get('invoiceDate'));
    const partyId = query.get('partyId')?.trim() ?? '';
    const partyName = query.get('partyName')?.trim() ?? '';
    const partyGstin = query.get('partyGstin')?.trim() ?? '';
    const taxableValue = this.queryNumber(query, 'taxableValue');
    const totalTax = this.queryNumber(query, 'totalTax');
    const invoiceValue = this.queryNumber(query, 'invoiceValue');
    const igst = this.queryNumber(query, 'igst');
    const cgst = this.queryNumber(query, 'cgst');
    const sgst = this.queryNumber(query, 'sgst');
    const isExportInvoice = this.isExportInvoiceQuery(query);

    if (!invoiceNumber && !invoiceDate && !partyName && !partyGstin && invoiceValue === 0) {
      return;
    }

    if (invoiceNumber) {
      this.autoNumbering.set(false);
      this.number.set(invoiceNumber);
    }
    if (invoiceDate) {
      this.date.set(invoiceDate);
      this.duedate.set(this.getDefaultDueDate(invoiceDate));
    }

    const customer = this.findCustomerForGstParty(partyGstin, partyName, partyId);
    if (customer) {
      this.selectCustomer(customer);
    } else if (partyName || partyGstin) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
      this.customerSearch.set(partyName || partyGstin);
      this.billingName.set(partyName || this.billingName());
      if (this.useBillingForShipping()) this.syncShippingFromBilling();
    }

    if (isExportInvoice) {
      this.taxoption.set('Export');
      this.currencycode.set('USD');
    }

    if (taxableValue || totalTax || invoiceValue) {
      const taxableBase = taxableValue || Math.max(invoiceValue - totalTax, 0) || invoiceValue;
      const taxes = this.buildGstReconciliationTaxes({
        taxableValue: taxableBase,
        totalTax,
        igst,
        cgst,
        sgst,
      });
      if (!isExportInvoice) {
        this.taxoption.set(igst > 0 ? 'Inter State' : 'Intra State');
      }
      this.items.set([
        {
          ...this.emptyItemRow(taxes.length),
          name: invoiceNumber ? `GST invoice ${invoiceNumber}` : 'GST invoice',
          description: [
            'Created from GST reconciliation.',
            partyName ? `Party: ${partyName}.` : '',
            partyGstin ? `GSTIN: ${partyGstin}.` : '',
          ]
            .filter(Boolean)
            .join(' '),
          price: taxableBase,
          quantity1: 1,
          quantity2: 1,
          itemtotal: taxableBase,
          subtotal: taxableBase,
          taxamount: totalTax,
          grandtotal: invoiceValue || taxableBase + totalTax,
          taxes,
        },
      ]);
    }
  }

  // ── Customer methods ──────────────────────────────────────────────────────

  onCustomerSearchInput(value: string | null): void {
    const q = (value ?? '').trim();
    this.customerSearch.set(q);
    this.showCustomerDropdown.set(true);
    if (!q) {
      this.selectedCustomer.set(null);
      this.customerid.set('');
    }
    if (this.customerSearchTimer) clearTimeout(this.customerSearchTimer);
    this.customerSearchTimer = setTimeout(() => {
      void this.customerStore.loadCustomers(
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
    else if (dayjs.isDayjs(value) && value.isValid()) newDate = value.format(DEFAULT_NODE_DATE_FORMAT);
    else if (value instanceof Date && !Number.isNaN(value.getTime()))
      newDate = dayjs(value).format(DEFAULT_NODE_DATE_FORMAT);

    if (!newDate) return;
    this.date.set(newDate);

    // Ensure due date is never before the invoice date
    if (this.duedate() && this.duedate() < newDate) {
      this.duedate.set(dayjs(newDate).add(14, 'day').format(DEFAULT_NODE_DATE_FORMAT));
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
    const q = (value ?? '').trim();
    this.itemSearch.set(q);
    this.activeItemRowIndex.set(rowIndex);

    if (this.itemSearchTimer) clearTimeout(this.itemSearchTimer);
    this.itemSearchTimer = setTimeout(() => {
      if (q) {
        // Typed search: hit the server with a filter and mark the cache as stale
        // (the store will hold filtered results after this, not the full list).
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
        // Empty query and no cached full list yet: fetch all items and cache the result.
        void this.itemStore.loadItems({ includes: ['category'] }).then(() => {
          this.emptyItemsLoaded = true;
        });
      }
      // else: empty query + full list already in store → no network call needed.
    }, DEFAULT_AUTOCOMPLETE_SEARCH_DEBOUNCE_MS);
  }

  /**
   * Signals that the full unfiltered item list has already been loaded into the
   * ItemStore (e.g. by the parent component's initial load), so the first
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

    const taxes = await this.buildTaxesForItem(item, this.taxoption());

    this.items.update((rows) =>
      rows.map((row, i) => {
        if (i !== rowIndex || row.itemid !== (item.id ?? '')) return row;

        return this.calcRow({
          ...row,
          item,
          itemid: item.id ?? '',
          name: item.name,
          code: item.code ?? '',
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

  // ── Create-customer navigation draft ─────────────────────────────────────

  private static readonly DRAFT_KEY = 'sale-invoice-create-draft';

  saveDraft(pendingItemRowIndex: number | null = null): void {
    try {
      const snapshot: SaleInvoiceDraftSnapshot = {
        autoNumbering: this.autoNumbering(),
        numberEnabled: this.numberEnabled(),
        number: this.number(),
        date: this.date(),
        duedate: this.duedate(),
        currencycode: this.currencycode(),
        conversionrate: this.conversionrate(),
        taxoption: this.taxoption(),
        deliverystate: this.deliverystate(),
        customerid: this.customerid(),
        selectedCustomer: this.selectedCustomer(),
        customerSearch: this.customerSearch(),
        useBillingForShipping: this.useBillingForShipping(),
        billingName: this.billingName(),
        billingLine1: this.billingLine1(),
        billingLine2: this.billingLine2(),
        billingCity: this.billingCity(),
        billingState: this.billingState(),
        billingZip: this.billingZip(),
        billingCountry: this.billingCountry(),
        shippingName: this.shippingName(),
        shippingLine1: this.shippingLine1(),
        shippingLine2: this.shippingLine2(),
        shippingCity: this.shippingCity(),
        shippingState: this.shippingState(),
        shippingZip: this.shippingZip(),
        shippingCountry: this.shippingCountry(),
        roundoff: this.roundoff(),
        showDiscount: this.showDiscount(),
        showDescription: this.showDescription(),
        items: this.items(),
        pendingItemRowIndex,
      };
      sessionStorage.setItem(SaleInvoiceDraftStore.DRAFT_KEY, JSON.stringify(snapshot));
    } catch {
      // sessionStorage may be unavailable (private browsing, quota, etc.)
    }
  }

  restoreAndClearDraft(): SaleInvoiceDraftSnapshot | null {
    try {
      const raw = sessionStorage.getItem(SaleInvoiceDraftStore.DRAFT_KEY);
      if (!raw) return null;
      sessionStorage.removeItem(SaleInvoiceDraftStore.DRAFT_KEY);
      return JSON.parse(raw) as SaleInvoiceDraftSnapshot;
    } catch {
      return null;
    }
  }

  applySnapshot(snapshot: SaleInvoiceDraftSnapshot): void {
    this.autoNumbering.set(snapshot.autoNumbering);
    this.numberEnabled.set(snapshot.numberEnabled);
    this.number.set(snapshot.number);
    this.date.set(snapshot.date);
    this.duedate.set(snapshot.duedate);
    this.currencycode.set(snapshot.currencycode);
    this.conversionrate.set(snapshot.conversionrate ?? '1');
    this.taxoption.set(snapshot.taxoption);
    this.deliverystate.set(snapshot.deliverystate);
    this.customerid.set(snapshot.customerid);
    this.selectedCustomer.set(snapshot.selectedCustomer);
    this.customerSearch.set(snapshot.customerSearch);
    this.useBillingForShipping.set(snapshot.useBillingForShipping);
    this.billingName.set(snapshot.billingName);
    this.billingLine1.set(snapshot.billingLine1);
    this.billingLine2.set(snapshot.billingLine2);
    this.billingCity.set(snapshot.billingCity);
    this.billingState.set(snapshot.billingState);
    this.billingZip.set(snapshot.billingZip);
    this.billingCountry.set(snapshot.billingCountry);
    this.shippingName.set(snapshot.shippingName);
    this.shippingLine1.set(snapshot.shippingLine1);
    this.shippingLine2.set(snapshot.shippingLine2);
    this.shippingCity.set(snapshot.shippingCity);
    this.shippingState.set(snapshot.shippingState);
    this.shippingZip.set(snapshot.shippingZip);
    this.shippingCountry.set(snapshot.shippingCountry);
    this.roundoff.set(snapshot.roundoff);
    this.showDiscount.set(snapshot.showDiscount);
    this.showDescription.set(snapshot.showDescription);
    this.items.set(snapshot.items);
    // pendingItemRowIndex is intentionally not restored as a signal — it is
    // read once by the parent component during initialisation and then discarded.
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private buildTaxes(item: Item, taxOption: string): TaxRow[] {
    const category = this.resolveItemCategory(item);
    const taxGroupId = category?.taxgroupid || category?.taxgroup?.id;
    if (!taxGroupId || !taxOption) return [];

    const tg = this.taxGroupStore.catalog().find((g) => g.id === taxGroupId);
    if (!tg) return [];

    const group = tg?.groups?.find((g) => g.mode === taxOption);
    if (!group) return [];

    return this.taxIdsForMode(tg, taxOption).map((taxId) => {
      const tax = this.taxStore.catalog().find((t) => t.id === taxId);
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

  private async buildTaxesForItem(item: Item, taxOption: string): Promise<TaxRow[]> {
    const category = this.resolveItemCategory(item);
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

  private resolveItemCategory(item: Item): ItemCategory | null {
    const categoryId = item.categoryid || item.category?.id;
    if (!categoryId) return item.category ?? null;

    const cached = this.itemCategoryStore.catalog().find((category) => category.id === categoryId);
    if (!cached) return item.category ?? null;

    return item.category ? { ...item.category, ...cached } : cached;
  }

  private async fetchTaxGroup(category: ItemCategory): Promise<TaxGroup | null> {
    if (category.taxgroup?.groups?.length) {
      return category.taxgroup;
    }

    const taxGroupId = category.taxgroupid || category.taxgroup?.id;
    if (!taxGroupId) return null;

    return (
      this.taxGroupStore.catalog().find((taxGroup) => taxGroup.id === taxGroupId) ??
      (await this.taxGroupStore.loadTaxGroupById(taxGroupId))
    );
  }

  private async fetchTax(taxId: string): Promise<Tax | null> {
    return (
      this.taxStore.catalog().find((tax) => tax.id === taxId) ?? this.taxStore.loadTaxById(taxId)
    );
  }

  private taxIdsForMode(taxGroup: TaxGroup, taxOption: string): readonly string[] {
    const group = taxGroup.groups?.find((currentGroup) => currentGroup.mode === taxOption);
    return group?.taxids ?? group?.taxes ?? [];
  }

  private findCustomerForGstParty(gstin: string, name: string, id = ''): Customer | null {
    const normalizedGstin = this.normalizeComparable(gstin);
    const normalizedName = this.normalizeComparable(name);
    const normalizedId = this.normalizeComparable(id);

    if (normalizedId) {
      const selectedCustomer = this.selectedCustomer();
      if (this.normalizeComparable(selectedCustomer?.id ?? '') === normalizedId) {
        return selectedCustomer;
      }

      const storeSelectedCustomer = this.customerStore.selectedItem();
      if (this.normalizeComparable(storeSelectedCustomer?.id ?? '') === normalizedId) {
        return storeSelectedCustomer;
      }
    }

    return (
      (this.customerStore.items() as Customer[]).find((customer) => {
        const customerId = this.normalizeComparable(customer.id ?? '');
        const customerGstin = this.normalizeComparable(customer.gstin ?? '');
        const customerName = this.normalizeComparable(customer.name ?? '');
        return (
          (normalizedId && customerId === normalizedId) ||
          (normalizedGstin && customerGstin === normalizedGstin) ||
          (!normalizedGstin && normalizedName && customerName === normalizedName)
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

  private isExportInvoiceQuery(query: ParamMap): boolean {
    const invoiceType = this.normalizeComparable(
      query.get('invoiceType') ??
        query.get('exportType') ??
        query.get('gstInvoiceType') ??
        query.get('supplyType') ??
        query.get('type') ??
        '',
    );

    return (
      invoiceType.includes('export') ||
      invoiceType === 'exp' ||
      invoiceType === 'wpay' ||
      invoiceType === 'wopay'
    );
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

  /**
   * After a row is updated, ensure there is exactly one trailing empty row when
   * any row already has a valid grand total (> 0).  Removes extra consecutive
   * empty rows at the tail so the list never accumulates blank placeholders.
   */
  private ensureTrailingEmptyRow(): void {
    this.items.update((rows) => {
      const isEmptyRow = (row: ItemRow) => !row.itemid && row.grandtotal === 0;

      // Only act when at least one row has a valid grand total.
      const hasValidTotal = rows.some((r) => r.grandtotal > 0);
      if (!hasValidTotal) return rows;

      // Count consecutive empty rows at the end.
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

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = toNum(this.quantityForRow(row)) || 1;
    const itemtotal = roundAmount(price * quantity);
    const discpercent = toNum(row.discpercent);
    const discamount = this.showDiscount() ? roundAmount((itemtotal * discpercent) / 100) : 0;
    const subtotal = roundAmount(itemtotal - discamount);

    let taxamount = 0;
    const taxes = row.taxes.map((t) => {
      const amount = roundAmount((subtotal * toNum(t.rate)) / 100);
      taxamount += amount;
      return { ...t, amount };
    });
    taxamount = roundAmount(taxamount);

    return {
      ...row,
      itemtotal,
      discamount,
      subtotal,
      taxamount,
      grandtotal: roundAmount(subtotal + taxamount),
      taxes,
    };
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
