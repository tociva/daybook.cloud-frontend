import type { BankCash } from '../../../data/bank-cash';
import type { PurchaseInvoice } from '../../../data/purchase-invoice';
import type { VendorPayment, VendorPaymentPayload } from '../../../data/vendor-payment';
import { roundMoneyForCurrency, toMinorUnits } from '../../../../../../shared/format/currency';

export type PurchaseInvoicePaymentRow = Readonly<{
  allocationId?: string;
  amount: number;
  bankCash?: BankCash;
  bankCashId?: string;
  currencycode?: string;
  date?: string;
  description?: string;
  hasPaymentDetail: boolean;
  number?: string;
  paymentId?: string;
}>;

export type PurchaseInvoicePaymentDraft = Readonly<{
  amount: number | string;
  autoNumbering: boolean;
  bankCashId: string;
  date: string;
  description: string;
  number: string;
}>;

export type PurchaseInvoicePaymentDraftValidationOptions = Readonly<{
  dateError?: string | null;
}>;

export function normalizePurchaseInvoicePaymentRows(
  invoice: PurchaseInvoice | null | undefined,
  fallbackPayments: readonly VendorPayment[] = [],
): readonly PurchaseInvoicePaymentRow[] {
  const fallbackById = new Map(
    fallbackPayments
      .filter((payment) => payment.id)
      .map((payment) => [payment.id as string, payment] as const),
  );

  return (invoice?.payments ?? []).map((link) => {
    const paymentId = link.vendorpayment?.id ?? link.vendorpaymentid;
    const fallback = paymentId ? fallbackById.get(paymentId) : undefined;
    const payment =
      link.vendorpayment || fallback
        ? {
            ...fallback,
            ...link.vendorpayment,
            bcash: link.vendorpayment?.bcash ?? fallback?.bcash,
            bcashid: link.vendorpayment?.bcashid ?? fallback?.bcashid,
          }
        : undefined;
    const currencycode = payment?.currencycode ?? invoice?.currencycode ?? invoice?.currency?.code;

    return {
      allocationId: link.id,
      amount: roundMoneyForCurrency(Number(link.amount) || 0, currencycode, invoice?.currency),
      bankCash: payment?.bcash,
      bankCashId: payment?.bcashid,
      currencycode,
      date: payment?.date,
      description: payment?.description,
      hasPaymentDetail: Boolean(
        payment?.number ||
        payment?.date ||
        payment?.bcashid ||
        payment?.bcash ||
        payment?.description,
      ),
      number: payment?.number,
      paymentId,
    };
  });
}

export function calculatePurchaseInvoicePaidTotal(
  invoice: PurchaseInvoice | null | undefined,
): number {
  return roundMoneyForCurrency(
    (invoice?.payments ?? []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
    invoiceCurrencyCode(invoice),
    invoice?.currency,
  );
}

export function calculatePurchaseInvoiceOutstanding(
  invoice: PurchaseInvoice | null | undefined,
): number {
  return roundMoneyForCurrency(
    Math.max((Number(invoice?.grandtotal) || 0) - calculatePurchaseInvoicePaidTotal(invoice), 0),
    invoiceCurrencyCode(invoice),
    invoice?.currency,
  );
}

export function getPurchaseInvoicePaymentDraftError(
  invoice: PurchaseInvoice | null | undefined,
  draft: PurchaseInvoicePaymentDraft,
  options: PurchaseInvoicePaymentDraftValidationOptions = {},
): string | null {
  if (!invoice?.id) return 'Purchase invoice is required.';
  if (!invoice.vendorid && !invoice.vendor?.id) return 'Vendor is required.';
  if (!draft.date.trim()) return 'Payment date is required.';
  if (options.dateError) return options.dateError;
  if (!draft.autoNumbering && !draft.number.trim()) return 'Payment number is required.';
  if (!draft.bankCashId.trim()) return 'Bank/Cash account is required.';

  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be greater than 0.';

  const currencycode = invoiceCurrencyCode(invoice);
  const outstanding = calculatePurchaseInvoiceOutstanding(invoice);
  if (
    toMinorUnits(amount, currencycode, invoice.currency) >
    toMinorUnits(outstanding, currencycode, invoice.currency)
  ) {
    return 'Amount cannot exceed outstanding balance.';
  }

  return null;
}

export function buildPurchaseInvoicePaymentPayload(
  invoice: PurchaseInvoice,
  draft: PurchaseInvoicePaymentDraft,
  options: PurchaseInvoicePaymentDraftValidationOptions = {},
): VendorPaymentPayload {
  const error = getPurchaseInvoicePaymentDraftError(invoice, draft, options);
  if (error) throw new Error(error);

  const currencycode = invoice.currencycode ?? invoice.currency?.code ?? 'INR';
  const amount = roundMoneyForCurrency(Number(draft.amount), currencycode, invoice.currency);
  const description = draft.description.trim();
  const number = draft.number.trim();

  return {
    ...(!draft.autoNumbering && number ? { number } : {}),
    amount,
    bcashid: draft.bankCashId.trim(),
    cprops: { autoNumbering: draft.autoNumbering },
    currencycode,
    date: draft.date.trim(),
    ...(description ? { description } : {}),
    invoices: [{ amount, purchaseinvoiceid: invoice.id as string }],
    vendorid: invoice.vendorid ?? invoice.vendor?.id ?? '',
  };
}

function invoiceCurrencyCode(invoice: PurchaseInvoice | null | undefined): string | undefined {
  return invoice?.currencycode ?? invoice?.currency?.code;
}
