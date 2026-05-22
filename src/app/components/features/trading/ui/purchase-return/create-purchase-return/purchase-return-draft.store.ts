import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import dayjs from 'dayjs';
import type { Item } from '../../../data/item';
import type { PurchaseReturn } from '../../../data/purchase-return';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import {
  PURCHASE_INVOICE_DETAIL_INCLUDES,
  PurchaseInvoiceStore,
} from '../../../data/purchase-invoice';
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

// ── Draft Store ───────────────────────────────────────────────────────────────

@Injectable()
export class PurchaseReturnDraftStore {
  private readonly purchaseInvoiceStore = inject(PurchaseInvoiceStore);
  private readonly fiscalYearDateRange = inject(FiscalYearDateRangeService);
  private loadingInvoiceId: string | null = null;

  // ── Submission flag ───────────────────────────────────────────────────────

  readonly submitted = signal(false);

  // ── Return detail signals ─────────────────────────────────────────────────

  readonly number = signal('');
  readonly date = signal(this.fiscalYearDateRange.defaultDate());
  readonly duedate = signal(this.getDefaultDueDate(this.date()));
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

  // ── Filtered lists ────────────────────────────────────────────────────────

  readonly filteredInvoices = computed<PurchaseInvoice[]>(() => {
    const q = this.invoiceSearch().toLowerCase();
    const list = this.purchaseInvoiceStore.items() as PurchaseInvoice[];
    return (
      q
        ? list.filter(
            (inv) =>
              inv.number?.toLowerCase().includes(q) || inv.vendor?.name?.toLowerCase().includes(q),
          )
        : list
    ).slice(0, 15);
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

  /**
   * Keep the initial return date inside the fiscal year once the range is loaded,
   * and keep the initial due date aligned to return date + 14 days.
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
    const selectedInvoice = this.selectedPurchaseInvoice();
    if (selectedInvoice && this.isSelectedInvoiceLabel(q, selectedInvoice)) return;

    const matchedInvoice =
      this.purchaseInvoiceStore
        .items()
        .find((invoice) => this.isSelectedInvoiceLabel(q, invoice)) ?? null;
    if (matchedInvoice?.id) {
      void this.selectInvoiceById(matchedInvoice.id, matchedInvoice);
      return;
    }

    this.invoiceSearch.set(q);
    if (!q) {
      this.selectedPurchaseInvoice.set(null);
      this.purchaseinvoiceid.set('');
    }
    void this.purchaseInvoiceStore.loadPurchaseInvoices(
      q
        ? { where: { number: { ilike: `%${q}%` } }, includes: ['vendor'] }
        : { includes: ['vendor'] },
    );
  }

  async selectInvoiceById(id: string, fallback?: PurchaseInvoice | null): Promise<void> {
    if (fallback) this.selectInvoice(fallback);
    if (this.loadingInvoiceId === id) return;
    if (this.purchaseinvoiceid() === id && this.selectedPurchaseInvoice()?.items !== undefined)
      return;

    this.loadingInvoiceId = id;
    try {
      const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(id, {
        includes: PURCHASE_INVOICE_DETAIL_INCLUDES,
      });
      if (invoice) this.selectInvoice(invoice);
    } finally {
      if (this.loadingInvoiceId === id) this.loadingInvoiceId = null;
    }
  }

  selectInvoice(invoice: PurchaseInvoice): void {
    this.selectedPurchaseInvoice.set(invoice);
    this.invoiceSearch.set(invoice.number ?? '');
    this.purchaseinvoiceid.set(invoice.id ?? '');
    this.taxoption.set(invoice.cprops?.taxoption ?? this.taxoption());

    // Pre-fill line items from the invoice's items if available
    if (invoice.items?.length) {
      this.items.set(
        invoice.items.map((invoiceItem) =>
          this.invoiceItemToReturnRow(invoiceItem, invoiceItem.quantity),
        ),
      );
    }
  }

  async mergeInvoiceItemsForEdit(invoiceId: string): Promise<void> {
    const invoice = await this.purchaseInvoiceStore.loadPurchaseInvoiceById(invoiceId, {
      includes: PURCHASE_INVOICE_DETAIL_INCLUDES,
    });
    if (!invoice) return;

    this.selectedPurchaseInvoice.set(invoice);
    this.invoiceSearch.set(invoice.number ?? '');
    this.purchaseinvoiceid.set(invoice.id ?? invoiceId);
    this.taxoption.set(invoice.cprops?.taxoption ?? this.taxoption());

    if (!invoice.items?.length) return;

    const returnRows = this.items();
    const usedReturnRows = new Set<number>();
    const mergedRows = invoice.items.map((invoiceItem) => {
      const invoiceItemId = invoiceItem.itemid ?? invoiceItem.item?.id ?? '';
      const matchingReturnIndex = returnRows.findIndex(
        (row, index) => !usedReturnRows.has(index) && row.itemid === invoiceItemId,
      );

      if (matchingReturnIndex >= 0) {
        usedReturnRows.add(matchingReturnIndex);
        return returnRows[matchingReturnIndex]!;
      }

      return this.invoiceItemToReturnRow(invoiceItem, 0);
    });

    const unmatchedReturnRows = returnRows.filter(
      (row, index) => !usedReturnRows.has(index) && !!row.itemid,
    );
    this.items.set([...mergedRows, ...unmatchedReturnRows]);
  }

  private isSelectedInvoiceLabel(value: string, invoice: PurchaseInvoice): boolean {
    const label = invoice.number
      ? `${invoice.number}${invoice.vendor?.name ? ' — ' + invoice.vendor.name : ''}`
      : (invoice.id ?? '');
    return value === label || value === invoice.number || value === invoice.id;
  }

  // ── Return detail methods ─────────────────────────────────────────────────

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

  // ── Item methods ──────────────────────────────────────────────────────────

  getItemDisplayName(row: ItemRow): string {
    return row.item?.displayname ?? row.item?.name ?? row.name ?? '';
  }

  updateItemField(rowIndex: number, field: 'price' | 'quantity', value: string | null): void {
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

  removeItemRow(index: number): void {
    if (this.items().length > 1) {
      this.items.update((rows) => rows.filter((_, i) => i !== index));
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private calcRow(row: ItemRow): ItemRow {
    const price = toNum(row.price);
    const quantity = Math.max(0, toNum(row.quantity));
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

  private getDefaultDueDate(date: string): string {
    return dayjs(date).add(14, 'day').format(DEFAULT_NODE_DATE_FORMAT);
  }

  private invoiceItemToReturnRow(
    invoiceItem: NonNullable<PurchaseInvoice['items']>[number],
    quantity: number,
  ): ItemRow {
    return this.calcRow({
      item: (invoiceItem.item as Item) ?? null,
      itemid: invoiceItem.itemid ?? invoiceItem.item?.id ?? '',
      name: invoiceItem.name,
      code: invoiceItem.code,
      description: invoiceItem.description ?? '',
      price: invoiceItem.price,
      quantity,
      itemtotal: 0,
      taxamount: 0,
      grandtotal: 0,
      taxes: (invoiceItem.taxes ?? []).map((tax) => ({
        taxid: tax.taxid ?? tax.tax?.id ?? '',
        name: tax.name,
        shortname: tax.shortname,
        rate: tax.rate,
        appliedto: tax.appliedto,
        amount: 0,
      })),
    });
  }

  private emptyItemRow(): ItemRow {
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
      taxes: [],
    };
  }
}
