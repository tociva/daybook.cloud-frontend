export interface Currency {
  name: string;
  html: string;
  unicode: string;
  decimal: number;
  shortName: string;
  fraction: string;
}

export interface CurrencyState {
  currencies: Currency[];
  loaded: boolean;
  error: string | null;
  search: string;
} 