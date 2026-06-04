const toAmount = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

export function createReportAmountFormatter(minorUnit = 2): (value: number | null | undefined) => string {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: minorUnit,
    maximumFractionDigits: minorUnit,
  });

  return (value: number | null | undefined): string => {
    const amount = toAmount(value);
    return amount === 0 ? '' : formatter.format(amount);
  };
}

export type NetBalance = Readonly<{
  side: 'Dr' | 'Cr';
  amount: number;
}>;

export function netBalance(debit: number, credit: number): NetBalance {
  const dr = toAmount(debit);
  const cr = toAmount(credit);
  if (dr > cr) return { side: 'Dr', amount: dr - cr };
  if (cr > dr) return { side: 'Cr', amount: cr - dr };
  return { side: 'Dr', amount: 0 };
}

export function formatNetBalance(
  debit: number,
  credit: number,
  formatAmount: (value: number | null | undefined) => string,
): string {
  const net = netBalance(debit, credit);
  if (net.amount === 0) return '';
  return `${formatAmount(net.amount)} ${net.side}`;
}
