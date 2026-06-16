import { Injectable, computed, inject } from '@angular/core';
import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { ItemStore } from '../../../data/item/item.store';
import type { Item } from '../../../data/item/item.model';
import { PurchaseInvoiceService } from '../../../data/purchase-invoice/purchase-invoice.service';
import { TaxStore } from '../../../data/tax/tax.store';
import type { Tax } from '../../../data/tax/tax.model';
import { VendorStore } from '../../../data/vendor/vendor.store';
import type { Vendor } from '../../../data/vendor/vendor.model';

const ROOT_KEY = 'invoices';
const MAX_ERRORS = 100;
const DEFAULT_MINOR_UNIT = 2;
const ACTIVE_STATUS = 1;

@Injectable({ providedIn: 'root' })
export class PurchaseInvoiceBulkUploadValidationService {
  private readonly vendorStore = inject(VendorStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxStore = inject(TaxStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly purchaseInvoiceService = inject(PurchaseInvoiceService);
  private readonly userSessionStore = inject(UserSessionStore);

  readonly branchMinorUnit = computed(() => this.resolveMinorUnit(this.currencyStore.currencies()));

  async prepare(): Promise<void> {
    await this.currencyStore.load();
  }

  async validateReferences(payload: BulkUploadPayload): Promise<readonly string[]> {
    const invoices = payload[ROOT_KEY];
    if (!Array.isArray(invoices)) {
      return [];
    }

    await Promise.all([
      this.vendorStore.loadVendors({}),
      this.itemStore.loadItems({}),
      this.taxStore.loadTaxes({}),
      this.currencyStore.load(),
    ]);

    const vendorsByName = indexVendorsByName(
      this.storeRows(this.vendorStore.catalog(), this.vendorStore.items()),
    );
    const itemsByName = indexItemsByName(
      this.storeRows(this.itemStore.catalog(), this.itemStore.items()),
    );
    const taxesByName = indexTaxesByName(
      this.storeRows(this.taxStore.catalog(), this.taxStore.items()),
    );
    const existingInvoiceKeys = await this.loadExistingInvoiceKeys(invoices, vendorsByName);

    const errors: string[] = [];

    for (const [index, invoice] of invoices.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      if (!isRecord(invoice)) continue;

      const number = readNonEmptyString(invoice['number']);
      const vendorName = readNonEmptyString(invoice['vendorname']);
      const invoicePrefix = invoiceError(index, number ?? undefined);
      const vendor = vendorName ? vendorsByName.get(normalizeKey(vendorName)) : null;
      const activeVendor = vendor && isActiveVendor(vendor) ? vendor : null;

      if (vendorName && !vendor) {
        errors.push(`${invoicePrefix}vendor not found.`);
      } else if (vendorName && vendor && !isActiveVendor(vendor)) {
        errors.push(`${invoicePrefix}vendor is inactive.`);
      }

      const currencyCode = readNonEmptyString(invoice['currencycode']);
      if (currencyCode && activeVendor && activeVendor.currencycode !== currencyCode) {
        errors.push(
          `${invoicePrefix}currencycode must match the selected vendor currency (${activeVendor.currencycode}).`,
        );
      }

      if (number && activeVendor?.id) {
        const invoiceKey = makeInvoiceKey(activeVendor.id, number);
        if (existingInvoiceKeys.has(invoiceKey)) {
          errors.push(
            `${invoicePrefix}invoice number already exists for this vendor in this branch.`,
          );
        }
      }

      const items = invoice['items'];
      if (!Array.isArray(items)) continue;

      for (const [itemIndex, item] of items.entries()) {
        if (errors.length >= MAX_ERRORS) break;
        if (!isRecord(item)) continue;

        const itemName = readNonEmptyString(item['name']);
        if (!itemName) continue;

        if (!itemsByName.has(normalizeKey(itemName))) {
          errors.push(
            itemError(index, number, itemIndex, itemName, 'item name not found in this branch.'),
          );
        }

        const taxes = item['taxes'];
        if (!Array.isArray(taxes)) continue;

        for (const [taxIndex, tax] of taxes.entries()) {
          if (errors.length >= MAX_ERRORS) break;
          if (!isRecord(tax)) continue;

          const taxName = readNonEmptyString(tax['name']);
          if (!taxName) continue;

          if (!taxesByName.has(normalizeKey(taxName))) {
            errors.push(
              taxError(
                index,
                number,
                itemIndex,
                itemName,
                taxIndex,
                'tax name not found in this branch.',
              ),
            );
          }
        }
      }
    }

    return errors;
  }

  private resolveMinorUnit(
    currencies: readonly { code: string; minorunit: number | null }[],
  ): number {
    const branchCurrencyCode = this.userSessionStore.session()?.branch?.currencycode;
    if (!branchCurrencyCode) return DEFAULT_MINOR_UNIT;

    const currency = currencies.find((entry) => entry.code === branchCurrencyCode);
    return currency?.minorunit ?? DEFAULT_MINOR_UNIT;
  }

  private storeRows<T>(catalog: readonly T[], items: readonly T[]): readonly T[] {
    return catalog.length ? catalog : items;
  }

  private async loadExistingInvoiceKeys(
    invoices: readonly unknown[],
    vendorsByName: ReadonlyMap<string, Vendor>,
  ): Promise<ReadonlySet<string>> {
    const requests = new Map<string, Readonly<{ number: string; vendorId: string }>>();

    for (const invoice of invoices) {
      if (!isRecord(invoice)) continue;

      const number = readNonEmptyString(invoice['number']);
      const vendorName = readNonEmptyString(invoice['vendorname']);
      if (!number || !vendorName) continue;

      const vendor = vendorsByName.get(normalizeKey(vendorName));
      if (!vendor?.id || !isActiveVendor(vendor)) continue;

      const key = makeInvoiceKey(vendor.id, number);
      requests.set(key, { number: number.trim(), vendorId: vendor.id });
    }

    if (!requests.size) {
      return new Set();
    }

    const numbers = [...new Set([...requests.values()].map((request) => request.number))];
    const vendorIds = [...new Set([...requests.values()].map((request) => request.vendorId))];
    const existing = await this.purchaseInvoiceService.list({
      where: {
        and: [{ number: { inq: numbers } }, { vendorid: { inq: vendorIds } }],
      },
    });

    return new Set(
      existing
        .map((invoice) => {
          const number = invoice.number?.trim();
          const vendorId = invoice.vendorid ?? invoice.vendor?.id;
          return number && vendorId ? makeInvoiceKey(vendorId, number) : null;
        })
        .filter((key): key is string => Boolean(key)),
    );
  }
}

function indexVendorsByName(vendors: readonly Vendor[]): ReadonlyMap<string, Vendor> {
  const map = new Map<string, Vendor>();
  for (const vendor of vendors) {
    const name = vendor.name?.trim();
    if (name) {
      map.set(normalizeKey(name), vendor);
    }
  }
  return map;
}

function indexItemsByName(items: readonly Item[]): ReadonlyMap<string, Item> {
  const map = new Map<string, Item>();
  for (const item of items) {
    const name = item.name?.trim();
    if (name) {
      map.set(normalizeKey(name), item);
    }
  }
  return map;
}

function indexTaxesByName(taxes: readonly Tax[]): ReadonlyMap<string, Tax> {
  const map = new Map<string, Tax>();
  for (const tax of taxes) {
    const name = tax.name?.trim();
    if (name) {
      map.set(normalizeKey(name), tax);
    }
  }
  return map;
}

function isActiveVendor(vendor: Vendor): boolean {
  return vendor.status === undefined || vendor.status === ACTIVE_STATUS;
}

function makeInvoiceKey(vendorId: string, number: string): string {
  return `${vendorId.trim()}::${normalizeKey(number)}`;
}

function invoiceError(index: number, number: string | undefined): string {
  const label = number?.trim() || '-';
  return `Invoice ${index + 1} (${label}): `;
}

function itemError(
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string,
  message: string,
): string {
  const invoiceLabel = invoiceNumber?.trim() || '-';
  return `Invoice ${invoiceIndex + 1} (${invoiceLabel}), ${itemName.trim()}: ${message}`;
}

function taxError(
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string,
  taxIndex: number,
  message: string,
): string {
  const invoiceLabel = invoiceNumber?.trim() || '-';
  return `Invoice ${invoiceIndex + 1} (${invoiceLabel}), ${itemName.trim()}, tax ${taxIndex + 1}: ${message}`;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
