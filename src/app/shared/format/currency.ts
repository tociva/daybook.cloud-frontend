/**
 * Formats a numeric amount with the currency symbol derived from the given
 * ISO 4217 currency code (e.g. 'INR' → '₹', 'USD' → '$').
 *
 * Falls back to `"CODE amount"` if the code is unrecognised by Intl.
 */
export function formatAmountWithCurrency(
  amount: number | undefined | null,
  currencycode: string | undefined | null,
): string {
  if (amount === undefined || amount === null) return '—';
  if (!currencycode) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencycode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencycode} ${amount.toFixed(2)}`;
  }
}
