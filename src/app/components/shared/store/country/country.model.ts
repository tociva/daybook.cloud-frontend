import { Currency } from './currency.model';
import { DateFormat } from './date-format.model';

export interface Country {
  name: string;
  code: string;
  iso: string;
  currency: Currency;
  dateFormat: DateFormat;
}

export interface CountryState {
  countries: Country[];
  loaded: boolean;
  error: string | null;
  search: string;
}