import { Injectable } from '@angular/core';
import type { BulkUploadPayload } from '../../../../../../shared/bulk-upload/bulk-upload-preview-config';
import type { BankCash } from '../../../data/bank-cash/bank-cash.model';
import { BankCashService } from '../../../data/bank-cash/bank-cash.service';
import type { PurchaseInvoice } from '../../../data/purchase-invoice/purchase-invoice.model';
import { PurchaseInvoiceService } from '../../../data/purchase-invoice/purchase-invoice.service';
import type { Vendor } from '../../../data/vendor/vendor.model';
import { VendorService } from '../../../data/vendor/vendor.service';

const ROOT_KEY = 'payments';
const MAX_ERRORS = 100;
const ACTIVE_STATUS = 1;
const EPSILON = 0.000001;

@Injectable({ providedIn: 'root' })
export class VendorPaymentBulkUploadValidationService {
  constructor(
    private readonly bankCashService: BankCashService,
    private readonly purchaseInvoiceService: PurchaseInvoiceService,
    private readonly vendorService: VendorService,
  ) {}

  async validateReferences(payload: BulkUploadPayload): Promise<readonly string[]> {
    const payments = payload[ROOT_KEY];
    if (!Array.isArray(payments)) {
      return [];
    }
    const [vendorsByName, bankCashByName, purchaseInvoicesByNumber] = await Promise.all([
      this.loadVendorsByName(payments),
      this.loadBankCashByName(payments),
      this.loadPurchaseInvoicesByNumber(payments),
    ]);

    const errors: string[] = [];

    for (const [index, payment] of payments.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      if (!isRecord(payment)) continue;

      const vendorName = readNonEmptyString(payment['vendorname']);
      const vendor = vendorName ? vendorsByName.get(vendorName.trim()) : null;
      const activeVendor = vendor && isActiveVendor(vendor) ? vendor : null;
      const paymentPrefix = paymentError(index, vendorName ?? undefined);

      if (vendorName && !vendor) {
        errors.push(`${paymentPrefix}vendor not found in current branch.`);
      } else if (vendorName && vendor && !activeVendor) {
        errors.push(`${paymentPrefix}vendor is inactive.`);
      }

      const currencyCode = readNonEmptyString(payment['currencycode']);
      if (currencyCode && activeVendor && activeVendor.currencycode !== currencyCode) {
        errors.push(
          `${paymentPrefix}currencycode must match the selected vendor currency (${activeVendor.currencycode}).`,
        );
      }

      const bankCashName = readNonEmptyString(payment['bcashname']);
      if (bankCashName && !bankCashByName.has(bankCashName.trim())) {
        errors.push(`${paymentPrefix}bank/cash account not found in current branch.`);
      }

      const invoices = payment['invoices'];
      if (!Array.isArray(invoices)) continue;

      this.validateAllocations(
        invoices,
        index,
        vendorName,
        readNumber(payment['amount']),
        purchaseInvoicesByNumber,
        errors,
      );
    }

    return errors;
  }

  private async loadVendorsByName(
    payments: readonly unknown[],
  ): Promise<ReadonlyMap<string, Vendor>> {
    const names = collectUniqueStrings(payments, 'vendorname');
    if (!names.length) {
      return new Map();
    }

    const vendors = await this.vendorService.list({
      where: { name: { inq: names } },
    });
    return indexByName(vendors);
  }

  private async loadBankCashByName(
    payments: readonly unknown[],
  ): Promise<ReadonlyMap<string, BankCash>> {
    const names = collectUniqueStrings(payments, 'bcashname');
    if (!names.length) {
      return new Map();
    }

    const accounts = await this.bankCashService.list({
      limit: names.length,
      where: { name: { inq: names } },
    });

    return indexByName(accounts);
  }

  private async loadPurchaseInvoicesByNumber(
    payments: readonly unknown[],
  ): Promise<ReadonlyMap<string, PurchaseInvoice>> {
    const numbers = collectUniqueInvoiceNumbers(payments);
    if (!numbers.length) {
      return new Map();
    }

    const invoices = await this.purchaseInvoiceService.list({
      includes: [{ relation: 'payments' }],
      limit: numbers.length,
      where: { number: { inq: numbers } },
    });

    return indexByNumber(invoices);
  }

  private validateAllocations(
    invoices: readonly unknown[],
    paymentIndex: number,
    vendorName: string | null,
    paymentAmount: number | null,
    purchaseInvoicesByNumber: ReadonlyMap<string, PurchaseInvoice>,
    errors: string[],
  ): void {
    const seenNumbers = new Map<string, number>();
    let totalAllocation = 0;

    for (const [allocationIndex, allocation] of invoices.entries()) {
      if (errors.length >= MAX_ERRORS) break;
      if (!isRecord(allocation)) continue;

      const invoiceNumber = readNonEmptyString(allocation['purchaseinvoicenumber']);
      const allocationAmount = readNumber(allocation['amount']);

      if (allocationAmount !== null) {
        totalAllocation += allocationAmount;
      }

      if (!invoiceNumber) continue;

      const normalizedInvoiceNumber = invoiceNumber.trim();
      const previousIndex = seenNumbers.get(normalizedInvoiceNumber);
      if (previousIndex !== undefined) {
        errors.push(
          allocationError(
            paymentIndex,
            vendorName,
            allocationIndex,
            `duplicate purchase invoice number "${normalizedInvoiceNumber}" (also used by allocation ${previousIndex + 1}).`,
          ),
        );
      } else {
        seenNumbers.set(normalizedInvoiceNumber, allocationIndex);
      }

      const purchaseInvoice = purchaseInvoicesByNumber.get(normalizedInvoiceNumber);
      if (!purchaseInvoice) {
        errors.push(
          allocationError(
            paymentIndex,
            vendorName,
            allocationIndex,
            'purchase invoice not found in current branch.',
          ),
        );
        continue;
      }

      if (allocationAmount !== null) {
        const existingPaymentTotal =
          purchaseInvoice.payments?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
        const grandTotal = purchaseInvoice.grandtotal;
        if (
          grandTotal !== undefined &&
          allocationAmount + existingPaymentTotal - grandTotal > EPSILON
        ) {
          errors.push(
            allocationError(
              paymentIndex,
              vendorName,
              allocationIndex,
              `total payment amount assigned to purchase invoice ${normalizedInvoiceNumber} is more than the purchase invoice amount.`,
            ),
          );
        }
      }
    }

    if (paymentAmount !== null && totalAllocation - paymentAmount > EPSILON) {
      errors.push(
        `${paymentError(paymentIndex, vendorName ?? undefined)}payment amount is less than the total allocation amount.`,
      );
    }
  }
}

function collectUniqueStrings(rows: readonly unknown[], key: string): readonly string[] {
  return [
    ...new Set(
      rows
        .filter(isRecord)
        .map((row) => readNonEmptyString(row[key]))
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim()),
    ),
  ];
}

function collectUniqueInvoiceNumbers(payments: readonly unknown[]): readonly string[] {
  return [
    ...new Set(
      payments
        .filter(isRecord)
        .flatMap((payment) => (Array.isArray(payment['invoices']) ? payment['invoices'] : []))
        .filter(isRecord)
        .map((invoice) => readNonEmptyString(invoice['purchaseinvoicenumber']))
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim()),
    ),
  ];
}

function indexByName<T extends { name?: string }>(rows: readonly T[]): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const name = row.name?.trim();
    if (name && !map.has(name)) {
      map.set(name, row);
    }
  }
  return map;
}

function indexByNumber<T extends { number?: string }>(rows: readonly T[]): ReadonlyMap<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    const number = row.number?.trim();
    if (number) {
      map.set(number, row);
    }
  }
  return map;
}

function isActiveVendor(vendor: Vendor): boolean {
  return vendor.status === undefined || vendor.status === ACTIVE_STATUS;
}

function paymentError(index: number, vendorName: string | undefined): string {
  const label = vendorName?.trim() || '-';
  return `Payment ${index + 1} (${label}): `;
}

function allocationError(
  paymentIndex: number,
  vendorName: string | null,
  allocationIndex: number,
  message: string,
): string {
  const paymentLabel = vendorName?.trim() || '-';
  return `Payment ${paymentIndex + 1} (${paymentLabel}), allocation ${
    allocationIndex + 1
  }: ${message}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
