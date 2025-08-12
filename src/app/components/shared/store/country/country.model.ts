import { DateFormat } from '../../util/date-format.model';
import { Currency } from '../currency/currency.model';

export interface Country {
  name: string;
  code: string;
  iso: string;
  currency: Currency;
  dateFormat?: DateFormat;
  dateformat: string;
}

export interface CountryState {
  countries: Country[];
  loaded: boolean;
  error: string | null;
  search: string;
}