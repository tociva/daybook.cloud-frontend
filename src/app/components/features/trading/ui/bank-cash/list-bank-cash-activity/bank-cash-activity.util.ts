import type { BankCashReportTransaction } from '../../../data/bank-cash-report';

export type BankCashActivityRow = Readonly<{
  amount: number;
  bankCashId: string;
  contraId: string | null;
  contraLeg: string;
  counterpartyName: string;
  currencycode?: string;
  date: string;
  description: string;
  payment: number;
  receipt: number;
  sourceId: string;
  sourceLabel: string;
  sourceRoute: readonly string[] | null;
  sourceType: BankCashReportTransaction['sourcetype'];
  transactionGroupId: string;
}>;

export function normalizeBankCashReportTransaction(
  transaction: BankCashReportTransaction,
): BankCashActivityRow {
  const contraId = transaction.contraid ?? null;

  return {
    amount: transaction.amount,
    bankCashId: transaction.bcashid,
    contraId,
    contraLeg: formatContraLeg(transaction.contraleg ?? null),
    counterpartyName: transaction.counterpartyname ?? '',
    currencycode: transaction.currencycode,
    date: transaction.date,
    description: transaction.description ?? '',
    payment: transaction.payment,
    receipt: transaction.receipt,
    sourceId: transaction.sourceid,
    sourceLabel: formatSourceType(transaction.sourcetype),
    sourceRoute: buildSourceRoute(transaction.sourcetype, transaction.sourceid, contraId),
    sourceType: transaction.sourcetype,
    transactionGroupId: transaction.transactiongroupid,
  };
}

export function formatSourceType(sourceType: BankCashReportTransaction['sourcetype']): string {
  switch (sourceType) {
    case 'contra':
      return 'Contra';
    case 'payment':
      return 'Payment';
    case 'receipt':
      return 'Receipt';
    default:
      return String(sourceType);
  }
}

export function formatContraLeg(leg: BankCashReportTransaction['contraleg']): string {
  switch (leg) {
    case 'from':
      return 'From';
    case 'to':
      return 'To';
    case null:
    case undefined:
    default:
      return '';
  }
}

function buildSourceRoute(
  sourceType: BankCashReportTransaction['sourcetype'],
  sourceId: string,
  contraId: string | null,
): readonly string[] | null {
  switch (sourceType) {
    case 'receipt':
      return ['/app/trading/customer-receipt', sourceId];
    case 'payment':
      return ['/app/trading/vendor-payment', sourceId];
    case 'contra':
      return contraId ? ['/app/trading/bank-cash/contra', contraId] : null;
    default:
      return null;
  }
}
