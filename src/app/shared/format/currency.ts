const DEFAULT_CURRENCY_MINOR_UNIT = 2;
const MAX_CURRENCY_MINOR_UNIT = 20;

export type CurrencyMinorUnitSource = Readonly<{
  code?: string | null;
  minorunit?: number | null;
}>;

export function getCurrencyMinorUnit(
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): number {
  const explicitMinorUnit = normalizeMinorUnit(currency?.minorunit);
  if (explicitMinorUnit !== null) return explicitMinorUnit;

  const code = resolveCurrencyCode(currencycode, currency);
  if (!code) return DEFAULT_CURRENCY_MINOR_UNIT;

  try {
    const resolvedMinorUnit = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
    }).resolvedOptions().maximumFractionDigits;

    return normalizeMinorUnit(resolvedMinorUnit) ?? DEFAULT_CURRENCY_MINOR_UNIT;
  } catch {
    return DEFAULT_CURRENCY_MINOR_UNIT;
  }
}

export function roundMoneyForCurrency(
  value: number,
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;

  const factor = 10 ** getCurrencyMinorUnit(currencycode, currency);
  return Math.round((amount + roundingAdjustment(amount)) * factor) / factor;
}

export function toMinorUnits(
  value: number,
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): number {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;

  const factor = 10 ** getCurrencyMinorUnit(currencycode, currency);
  return Math.round((amount + roundingAdjustment(amount)) * factor);
}

export function formatAmountForCurrency(
  amount: number,
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): string {
  const minorUnit = getCurrencyMinorUnit(currencycode, currency);
  return roundMoneyForCurrency(amount, currencycode, currency).toFixed(minorUnit);
}

/**
 * Formats a numeric amount with the currency symbol derived from the given
 * ISO 4217 currency code (e.g. 'INR' -> '₹', 'USD' -> '$').
 *
 * Falls back to `"CODE amount"` if the code is unrecognised by Intl.
 */
export function formatAmountWithCurrency(
  amount: number | undefined | null,
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): string {
  if (amount === undefined || amount === null) return '—';

  const code = resolveCurrencyCode(currencycode, currency);
  if (!code) return formatAmountForCurrency(amount, currencycode, currency);

  const minorUnit = getCurrencyMinorUnit(code, currency);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: minorUnit,
      maximumFractionDigits: minorUnit,
    }).format(roundMoneyForCurrency(amount, code, currency));
  } catch {
    return `${code} ${formatAmountForCurrency(amount, code, currency)}`;
  }
}

function resolveCurrencyCode(
  currencycode: string | undefined | null,
  currency?: CurrencyMinorUnitSource | null,
): string | null {
  const code = currencycode?.trim() || currency?.code?.trim();
  return code ? code.toUpperCase() : null;
}

function normalizeMinorUnit(value: number | undefined | null): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_CURRENCY_MINOR_UNIT
  ) {
    return null;
  }

  return value;
}

function roundingAdjustment(value: number): number {
  return value >= 0 ? Number.EPSILON : -Number.EPSILON;
}
