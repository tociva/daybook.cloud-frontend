import { Currency } from "../components/shared/store/currency/currency.model";

export const toNumber = (v: unknown): number =>
  typeof v === 'number'
    ? v
    : typeof v === 'string'
      ? Number(v.replace(/,/g, '').trim() || 0)
      : 0;
      
export const isInMillions = (currency: Currency): boolean => {
  return !['INR', 'PKR'].includes(currency?.code?.toUpperCase() ?? '');
};

export const formatAmountToFraction = (value?: unknown, fractions = 2): string => {
  if(!value) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  const formattedValue = num.toFixed(fractions);
  return formattedValue;
};

export const formatAmountToWords = (value: number, currency?: Currency): string => {
  if (!currency) return '';

  const minorUnit = Number.isInteger(currency.minorunit as number) ? (currency.minorunit as number) : 2;
  const useInternational = isInMillions(currency);
  const symbol = currency.symbol ?? '';

  // normalize sign + round to minor unit
  const isNegative = value < 0;
  const factor = Math.pow(10, minorUnit || 0);
  const abs = Math.abs(value);
  const rounded = factor ? Math.round(abs * factor) / factor : Math.round(abs);
  const integerPart = Math.trunc(rounded);
  const fractionRaw = factor ? Math.round((rounded - integerPart) * factor) : 0;

  const toWords = useInternational ? toWordsInternational : toWordsIndian;

  const majorWords = integerPart === 0 ? 'zero' : toWords(integerPart);
  const majorUnit = pluralizeMajorUnit(currency.name, integerPart);

  let out = `${symbol} ${isNegative ? 'minus ' : ''}${majorWords} ${majorUnit}`.trim();

  if ((minorUnit ?? 0) > 0 && fractionRaw > 0) {
    const fracWords = toWords(fractionRaw);
    const fracUnit = pluralizeFraction(currency.fraction ?? '', fractionRaw);
    out += ` and ${fracWords} ${fracUnit}`;
  }

  return out;
};

/* ---------- helpers ---------- */

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen'
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}

function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  if (h && r) return `${ONES[h]} hundred ${twoDigitsToWords(r)}`;
  if (h) return `${ONES[h]} hundred`;
  return twoDigitsToWords(r);
}

/** International: thousand, million, billion, trillion */
function toWordsInternational(n: number): string {
  if (n === 0) return 'zero';
  const scales = ['', 'thousand', 'million', 'billion', 'trillion'];
  const parts: string[] = [];
  let i = 0;
  while (n > 0 && i < scales.length) {
    const chunk = n % 1000;
    if (chunk) {
      const w = threeDigitsToWords(chunk);
      parts.unshift(scales[i] ? `${w} ${scales[i]}` : w);
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return parts.join(' ').trim();
}

/** Indian: thousand, lakh, crore */
function toWordsIndian(n: number): string {
  if (n === 0) return 'zero';
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const rest = n;

  if (crore) parts.push(`${threeDigitsToWords(crore)} crore`);
  if (lakh) parts.push(`${threeDigitsToWords(lakh)} lakh`);
  if (thousand) parts.push(`${threeDigitsToWords(thousand)} thousand`);
  if (rest) parts.push(threeDigitsToWords(rest));

  return parts.join(' ').trim();
}

function pluralizeMajorUnit(name: string, qty: number): string {
  const base = (name || '').trim();
  if (!base) return qty === 1 ? 'unit' : 'units';

  const lower = base.toLowerCase();
  const irregular: Record<string, [singular: string, plural: string]> = {
    'dollar': ['dollar', 'dollars'],
    'us dollar': ['dollar', 'dollars'],
    'canadian dollar': ['dollar', 'dollars'],
    'australian dollar': ['dollar', 'dollars'],
    'singapore dollar': ['dollar', 'dollars'],
    'rupee': ['rupee', 'rupees'],
    'indian rupee': ['rupee', 'rupees'],
    'pakistani rupee': ['rupee', 'rupees'],
    'euro': ['euro', 'euros'],
    'pound': ['pound', 'pounds'],
    'pound sterling': ['pound', 'pounds'],
    'yen': ['yen', 'yen'],
  };

  const entry = irregular[lower];
  if (entry) return qty === 1 ? entry[0] : entry[1];

  if (qty === 1) return base.toLowerCase();
  if (base.endsWith('y') && !/[aeiou]y$/i.test(base)) return base.slice(0, -1).toLowerCase() + 'ies';
  if (base.endsWith('s')) return base.toLowerCase();
  return base.toLowerCase() + 's';
}

/** Pluralize **only** the provided fraction (singular). */
function pluralizeFraction(singularFromCurrency: string, qty: number): string {
  const singular = (singularFromCurrency || '').trim().toLowerCase();
  if (!singular) return qty === 1 ? 'cent' : 'cents'; // very last-resort fallback

  // irregulars / invariants
  if (singular === 'penny') return qty === 1 ? 'penny' : 'pence';
  if (singular === 'paisa') return qty === 1 ? 'paisa' : 'paise';
  if (singular === 'paise') return 'paise';
  if (singular === 'sen') return 'sen';

  // generic pluralization
  if (qty === 1) return singular;
  if (singular.endsWith('y') && !/[aeiou]y$/i.test(singular)) return singular.slice(0, -1) + 'ies';
  if (singular.endsWith('s')) return singular; // assume already plural
  return singular + 's';
}
