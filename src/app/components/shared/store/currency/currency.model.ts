export interface Currency {
  code: string;
  name: string;
  symbol: string;
  numericcode: number;
  minorunit: number | null;
  fraction?: string;
}

export interface CurrencyState {
  currencies: Currency[];
  loaded: boolean;
  error: string | null;
  search: string;
} 