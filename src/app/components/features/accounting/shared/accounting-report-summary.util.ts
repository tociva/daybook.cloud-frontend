export type AccountingReportSummary = Readonly<{
  openingDebit: number;
  openingCredit: number;
  runningDebit: number;
  runningCredit: number;
  closingDebit: number;
  closingCredit: number;
}>;

export type AccountingReportSummaryMetric = Readonly<{
  id: 'openingBalance' | 'runningDebit' | 'runningCredit' | 'closingBalance';
  label: 'Opening Balance' | 'Running Debit' | 'Running Credit' | 'Closing Balance';
  value: string;
}>;

function formatSummaryMoney(
  value: number | null | undefined,
  minorUnit: number,
  symbol: string,
): string {
  const amount = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  });
  return `${symbol} ${formatter.format(amount)}`;
}

function formatSummaryBalance(
  debit: number,
  credit: number,
  minorUnit: number,
  symbol: string,
  showZeroDebitSide: boolean,
): string {
  const dr = typeof debit === 'number' && Number.isFinite(debit) ? debit : 0;
  const cr = typeof credit === 'number' && Number.isFinite(credit) ? credit : 0;

  if (dr > cr) return `${formatSummaryMoney(dr - cr, minorUnit, symbol)} Dr`;
  if (cr > dr) return `${formatSummaryMoney(cr - dr, minorUnit, symbol)} Cr`;
  return showZeroDebitSide
    ? `${formatSummaryMoney(0, minorUnit, symbol)} Dr`
    : formatSummaryMoney(0, minorUnit, symbol);
}

export function buildAccountingReportSummaryMetrics(
  summary: AccountingReportSummary,
  minorUnit = 2,
  currencySymbol = '₹',
): readonly AccountingReportSummaryMetric[] {
  return [
    {
      id: 'openingBalance',
      label: 'Opening Balance',
      value: formatSummaryBalance(
        summary.openingDebit,
        summary.openingCredit,
        minorUnit,
        currencySymbol,
        true,
      ),
    },
    {
      id: 'runningDebit',
      label: 'Running Debit',
      value: formatSummaryMoney(summary.runningDebit, minorUnit, currencySymbol),
    },
    {
      id: 'runningCredit',
      label: 'Running Credit',
      value: formatSummaryMoney(summary.runningCredit, minorUnit, currencySymbol),
    },
    {
      id: 'closingBalance',
      label: 'Closing Balance',
      value: formatSummaryBalance(
        summary.closingDebit,
        summary.closingCredit,
        minorUnit,
        currencySymbol,
        false,
      ),
    },
  ];
}
