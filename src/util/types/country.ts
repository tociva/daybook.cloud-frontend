import { Currency } from './currency';

export interface Country {
  code: string;
  name: string;
  iso: string;
  currency: Currency;
  dateformat: string;
  timezone: string;
}
