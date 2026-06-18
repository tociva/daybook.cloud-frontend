import { roundMoneyForCurrency, toMinorUnits } from '../../../../../../shared/format/currency';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';

export function totalPurchaseInvoicePaid(row: PurchaseInvoice): number | undefined {
  if (!row.payments?.length) return undefined;
  return roundMoneyForCurrency(sumPayments(row), invoiceCurrencyCode(row), row.currency);
}

export function isPurchaseInvoicePaid(row: PurchaseInvoice): boolean {
  const grandtotal = row.grandtotal ?? 0;
  if (grandtotal <= 0) return false;

  const currencycode = invoiceCurrencyCode(row);
  const paidMinorUnits = toMinorUnits(sumPayments(row), currencycode, row.currency);
  const grandTotalMinorUnits = toMinorUnits(grandtotal, currencycode, row.currency);
  return paidMinorUnits >= grandTotalMinorUnits;
}

export function isPurchaseInvoiceOverdue(row: PurchaseInvoice, now = new Date()): boolean {
  if (isPurchaseInvoicePaid(row) || !row.duedate) return false;
  return now > new Date(row.duedate);
}

function sumPayments(row: PurchaseInvoice): number {
  return row.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
}

function invoiceCurrencyCode(row: PurchaseInvoice): string | undefined {
  return row.currencycode ?? row.currency?.code;
}
