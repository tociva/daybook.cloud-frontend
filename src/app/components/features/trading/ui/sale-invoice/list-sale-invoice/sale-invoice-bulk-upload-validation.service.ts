import { Injectable, computed, inject } from '@angular/core';
import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import { CurrencyStore } from '../../../../management/data/currency/currency.store';
import { UserSessionStore } from '../../../../management/data/user-session/user-session.store';
import { CustomerStore } from '../../../data/customer/customer.store';
import type { Customer } from '../../../data/customer/customer.model';
import { ItemStore } from '../../../data/item/item.store';
import type { Item } from '../../../data/item/item.model';
import { SaleInvoiceService } from '../../../data/sale-invoice/sale-invoice.service';
import { TaxStore } from '../../../data/tax/tax.store';
import type { Tax } from '../../../data/tax/tax.model';

const ROOT_KEY = 'invoices';
const MAX_ERRORS = 100;
const DEFAULT_MINOR_UNIT = 2;

@Injectable({ providedIn: 'root' })
export class SaleInvoiceBulkUploadValidationService {
  private readonly customerStore = inject(CustomerStore);
  private readonly itemStore = inject(ItemStore);
  private readonly taxStore = inject(TaxStore);
  private readonly currencyStore = inject(CurrencyStore);
  private readonly saleInvoiceService = inject(SaleInvoiceService);
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
      this.customerStore.loadCustomers({}),
      this.itemStore.loadItems({}),
      this.taxStore.loadTaxes({}),
      this.currencyStore.load(),
    ]);

    const customersByName = indexCustomersByName(this.customerStore.catalog());
    const itemsByName = indexItemsByName(this.itemStore.catalog());
    const taxesByName = indexTaxesByName(this.taxStore.catalog());
    const existingNumbers = await this.loadExistingInvoiceNumbers(invoices);

    const errors: string[] = [];

    for (const [index, invoice] of invoices.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      if (!isRecord(invoice)) continue;

      const number = readNonEmptyString(invoice['number']);
      const customerName = readNonEmptyString(invoice['customername']);
      const invoicePrefix = invoiceError(index, number ?? undefined);

      if (number) {
        const normalizedNumber = number.trim().toLowerCase();
        if (existingNumbers.has(normalizedNumber)) {
          errors.push(`${invoicePrefix}invoice number already exists in this branch.`);
        }
      }

      const customer = customerName ? customersByName.get(customerName.trim().toLowerCase()) : null;
      if (customerName && !customer) {
        errors.push(`${invoicePrefix}customer not found.`);
      }

      const currencyCode = readNonEmptyString(invoice['currencycode']);
      if (currencyCode && customer && customer.currencycode !== currencyCode) {
        errors.push(
          `${invoicePrefix}currencycode must match the selected customer currency (${customer.currencycode}).`,
        );
      }

      const items = invoice['items'];
      if (!Array.isArray(items)) continue;

      for (const [itemIndex, item] of items.entries()) {
        if (errors.length >= MAX_ERRORS) break;
        if (!isRecord(item)) continue;

        const itemName = readNonEmptyString(item['name']);
        if (!itemName) continue;

        if (!itemsByName.has(itemName.trim().toLowerCase())) {
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

          if (!taxesByName.has(taxName.trim().toLowerCase())) {
            errors.push(
              taxError(index, number, itemIndex, itemName, taxIndex, 'tax name not found in this branch.'),
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

  private async loadExistingInvoiceNumbers(
    invoices: readonly unknown[],
  ): Promise<ReadonlySet<string>> {
    const numbers = [
      ...new Set(
        invoices
          .filter(isRecord)
          .map((invoice) => readNonEmptyString(invoice['number']))
          .filter((number): number is string => Boolean(number))
          .map((number) => number.trim()),
      ),
    ];

    if (!numbers.length) {
      return new Set();
    }

    const existing = await this.saleInvoiceService.list({
      where: { number: { inq: numbers } },
    });

    return new Set(
      existing
        .map((invoice) => invoice.number?.trim().toLowerCase())
        .filter((number): number is string => Boolean(number)),
    );
  }
}

function indexCustomersByName(customers: readonly Customer[]): ReadonlyMap<string, Customer> {
  const map = new Map<string, Customer>();
  for (const customer of customers) {
    const name = customer.name?.trim().toLowerCase();
    if (name) {
      map.set(name, customer);
    }
  }
  return map;
}

function indexItemsByName(items: readonly Item[]): ReadonlyMap<string, Item> {
  const map = new Map<string, Item>();
  for (const item of items) {
    const name = item.name?.trim().toLowerCase();
    if (name) {
      map.set(name, item);
    }
  }
  return map;
}

function indexTaxesByName(taxes: readonly Tax[]): ReadonlyMap<string, Tax> {
  const map = new Map<string, Tax>();
  for (const tax of taxes) {
    const name = tax.name?.trim().toLowerCase();
    if (name) {
      map.set(name, tax);
    }
  }
  return map;
}

function invoiceError(index: number, number: string | undefined): string {
  const label = number?.trim() || '—';
  return `Invoice ${index + 1} (${label}): `;
}

function itemError(
  invoiceIndex: number,
  invoiceNumber: string | null,
  itemIndex: number,
  itemName: string,
  message: string,
): string {
  const invoiceLabel = invoiceNumber?.trim() || '—';
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
  const invoiceLabel = invoiceNumber?.trim() || '—';
  return `Invoice ${invoiceIndex + 1} (${invoiceLabel}), ${itemName.trim()}, tax ${taxIndex + 1}: ${message}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
