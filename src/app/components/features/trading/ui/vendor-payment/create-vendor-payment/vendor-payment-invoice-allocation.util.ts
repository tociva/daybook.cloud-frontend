import type { PurchaseInvoice } from '../../../data/purchase-invoice/purchase-invoice.model';

const EPSILON = 0.000001;

export type VendorPaymentInvoiceAllocationRow = Readonly<{
  invoice: PurchaseInvoice | null;
  amount: number;
}>;

export type VendorPaymentInvoiceAllocationOptions = Readonly<{
  currencycode?: string;
  currentVendorPaymentId?: string | null;
}>;

export function invoiceTotal(invoice: PurchaseInvoice | null | undefined): number {
  return invoice?.grandtotal ?? 0;
}

export function paidTotal(
  invoice: PurchaseInvoice | null | undefined,
  options: VendorPaymentInvoiceAllocationOptions = {},
): number {
  return (
    invoice?.payments?.reduce((sum, payment) => {
      if (
        options.currentVendorPaymentId &&
        payment.vendorpaymentid === options.currentVendorPaymentId
      ) {
        return sum;
      }

      return sum + (Number(payment.amount) || 0);
    }, 0) ?? 0
  );
}

export function outstandingBalance(
  invoice: PurchaseInvoice | null | undefined,
  options: VendorPaymentInvoiceAllocationOptions = {},
): number {
  return roundAmount(Math.max(invoiceTotal(invoice) - paidTotal(invoice, options), 0));
}

export function allocationTotal(rows: readonly VendorPaymentInvoiceAllocationRow[]): number {
  return roundAmount(
    rows.filter((row) => row.invoice?.id).reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
  );
}

export function paymentRemaining(
  paymentAmount: number,
  rows: readonly VendorPaymentInvoiceAllocationRow[],
): number {
  return roundAmount((Number(paymentAmount) || 0) - allocationTotal(rows));
}

export function isPaymentRemainingNegative(
  paymentAmount: number,
  rows: readonly VendorPaymentInvoiceAllocationRow[],
): boolean {
  return paymentRemaining(paymentAmount, rows) < 0;
}

export function formatMoneyAmount(amount: number): string {
  return amount.toFixed(2);
}

export function formatCurrencyAmount(currencycode: string, amount: number): string {
  const code = currencycode.trim();
  const value = formatMoneyAmount(amount);
  return code ? `${code} ${value}` : value;
}

export function invoiceBalanceSummary(invoice: PurchaseInvoice, currencycode: string): string {
  return `Total ${formatCurrencyAmount(currencycode, invoiceTotal(invoice))} / Outstanding ${formatCurrencyAmount(
    currencycode,
    outstandingBalance(invoice),
  )}`;
}

export function validateVendorPaymentInvoiceAllocations(
  rows: readonly VendorPaymentInvoiceAllocationRow[],
  paymentAmount: number,
  options: VendorPaymentInvoiceAllocationOptions = {},
): string | null {
  const amount = Number(paymentAmount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const selectedRows = rows.filter((row) => row.invoice?.id);
  if (!selectedRows.length) return null;

  const currencycode = options.currencycode ?? '';
  const seenInvoiceIds = new Set<string>();

  for (const row of selectedRows) {
    const invoice = row.invoice!;
    const invoiceId = invoice.id!;
    const invoiceName = invoice.number ?? invoiceId;
    const allocation = Number(row.amount);

    if (seenInvoiceIds.has(invoiceId)) {
      return `Purchase invoice ${invoiceName} is selected more than once.`;
    }
    seenInvoiceIds.add(invoiceId);

    if (!Number.isFinite(allocation) || allocation <= 0) {
      return `Allocation for purchase invoice ${invoiceName} must be greater than 0.`;
    }

    const available = outstandingBalance(invoice, options);
    if (allocation - available > EPSILON) {
      return `Allocation for purchase invoice ${invoiceName} cannot exceed outstanding balance ${formatCurrencyAmount(
        currencycode,
        available,
      )}.`;
    }
  }

  const allocated = allocationTotal(selectedRows);
  if (allocated - amount > EPSILON) {
    return `Allocated total ${formatCurrencyAmount(
      currencycode,
      allocated,
    )} cannot exceed payment amount ${formatCurrencyAmount(currencycode, amount)}.`;
  }

  return null;
}

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
