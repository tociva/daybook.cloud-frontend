import type { BankCash } from '../../../data/bank-cash';
import type { CustomerReceipt, CustomerReceiptPayload } from '../../../data/customer-receipt';
import type { SaleInvoice } from '../../../data/sale-invoice';

const EPSILON = 0.000001;

export type SaleInvoiceReceiptRow = Readonly<{
  allocationId?: string;
  amount: number;
  bankCash?: BankCash;
  bankCashId?: string;
  currencycode?: string;
  date?: string;
  description?: string;
  hasReceiptDetail: boolean;
  number?: string;
  receiptId?: string;
}>;

export type SaleInvoiceReceiptDraft = Readonly<{
  amount: number | string;
  autoNumbering: boolean;
  bankCashId: string;
  date: string;
  description: string;
  number: string;
}>;

export type SaleInvoiceReceiptDraftValidationOptions = Readonly<{
  dateError?: string | null;
}>;

export function normalizeSaleInvoiceReceiptRows(
  invoice: SaleInvoice | null | undefined,
  fallbackReceipts: readonly CustomerReceipt[] = [],
): readonly SaleInvoiceReceiptRow[] {
  const fallbackById = new Map(
    fallbackReceipts
      .filter((receipt) => receipt.id)
      .map((receipt) => [receipt.id as string, receipt] as const),
  );

  return (invoice?.receipts ?? []).map((link) => {
    const receiptId = link.customerreceipt?.id ?? link.customerreceiptid;
    const fallback = receiptId ? fallbackById.get(receiptId) : undefined;
    const receipt =
      link.customerreceipt || fallback
        ? {
            ...fallback,
            ...link.customerreceipt,
            bcash: link.customerreceipt?.bcash ?? fallback?.bcash,
            bcashid: link.customerreceipt?.bcashid ?? fallback?.bcashid,
          }
        : undefined;

    return {
      allocationId: link.id,
      amount: roundMoney(Number(link.amount) || 0),
      bankCash: receipt?.bcash,
      bankCashId: receipt?.bcashid,
      currencycode: receipt?.currencycode ?? invoice?.currencycode ?? invoice?.currency?.code,
      date: receipt?.date,
      description: receipt?.description,
      hasReceiptDetail: Boolean(
        receipt?.number ||
          receipt?.date ||
          receipt?.bcashid ||
          receipt?.bcash ||
          receipt?.description,
      ),
      number: receipt?.number,
      receiptId,
    };
  });
}

export function calculateSaleInvoiceReceivedTotal(
  invoice: SaleInvoice | null | undefined,
): number {
  return roundMoney(
    (invoice?.receipts ?? []).reduce((sum, receipt) => sum + (Number(receipt.amount) || 0), 0),
  );
}

export function calculateSaleInvoiceOutstanding(
  invoice: SaleInvoice | null | undefined,
): number {
  return roundMoney(
    Math.max((Number(invoice?.grandtotal) || 0) - calculateSaleInvoiceReceivedTotal(invoice), 0),
  );
}

export function getSaleInvoiceReceiptDraftError(
  invoice: SaleInvoice | null | undefined,
  draft: SaleInvoiceReceiptDraft,
  options: SaleInvoiceReceiptDraftValidationOptions = {},
): string | null {
  if (!invoice?.id) return 'Sale invoice is required.';
  if (!invoice.customerid && !invoice.customer?.id) return 'Customer is required.';
  if (!draft.date.trim()) return 'Receipt date is required.';
  if (options.dateError) return options.dateError;
  if (!draft.autoNumbering && !draft.number.trim()) return 'Receipt number is required.';
  if (!draft.bankCashId.trim()) return 'Bank/Cash account is required.';

  const amount = Number(draft.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 'Amount must be greater than 0.';

  const outstanding = calculateSaleInvoiceOutstanding(invoice);
  if (roundMoney(amount) - outstanding > EPSILON) {
    return 'Amount cannot exceed outstanding balance.';
  }

  return null;
}

export function buildSaleInvoiceReceiptPayload(
  invoice: SaleInvoice,
  draft: SaleInvoiceReceiptDraft,
  options: SaleInvoiceReceiptDraftValidationOptions = {},
): CustomerReceiptPayload {
  const error = getSaleInvoiceReceiptDraftError(invoice, draft, options);
  if (error) throw new Error(error);

  const amount = roundMoney(Number(draft.amount));
  const description = draft.description.trim();
  const number = draft.number.trim();

  return {
    ...(!draft.autoNumbering && number ? { number } : {}),
    amount,
    bcashid: draft.bankCashId.trim(),
    cprops: { autoNumbering: draft.autoNumbering },
    currencycode: invoice.currencycode ?? invoice.currency?.code ?? 'INR',
    customerid: invoice.customerid ?? invoice.customer?.id ?? '',
    date: draft.date.trim(),
    ...(description ? { description } : {}),
    invoices: [{ amount, saleinvoiceid: invoice.id as string }],
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
