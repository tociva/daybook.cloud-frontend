import type { Country } from '../country/country.model';
import type { Currency } from '../currency/currency.model';
import type { DateFormat } from '../date-format/date-format.model';
import type { Branch } from '../branch/branch.model';
import type { Address } from '../../../../../util/types/address';

export type Organization = Readonly<{
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: Address;
  description?: string;
  createdat?: Date;
  updatedat?: Date;
  userid: string;
  branches: readonly Branch[];
}>;

export type OrganizationBootstrap = Readonly<{
  name: string;
  email: string;
  mobile?: string;
  address: Address;
  description?: string;
  countrycode: string;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  startdate: string;
  enddate: string;
  gstin?: string;
  invnumber: string;
  currencycode: string;
  jnumber: string;
  dateformat: string;
}>;

export type OrganizationBootstrapFormData = Readonly<{
  name: string;
  email: string;
  mobile?: string;
  address: Address;
  description?: string;
  country: Country;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  fiscaldaterange: readonly string[];
  gstin?: string;
  invnumber: string;
  currency: Currency;
  jnumber: string;
  dateformatForm?: DateFormat;
}>;

