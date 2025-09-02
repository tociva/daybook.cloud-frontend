import { DateFormat } from '../../util/date-format.model';
import { Currency } from '../currency/currency.model';

export interface Country {
  code: string;
  name: string;
  iso: string;
  phone: string;
  currencycode: string;
  dateformat: string;
  fiscalstart: string;
  timezone?: string;
  currency?: Currency;
  dateFormat?: DateFormat;
}

export interface CountryState {
  countries: Country[];
  loaded: boolean;
  error: string | null;
  search: string;
}