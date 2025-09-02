import { Address } from "../../../../../util/types/address";
import { Branch } from "../branch/branch.model";
import { Country } from "../../../../shared/store/country/country.model";
import { Currency } from "../../../../shared/store/currency/currency.model";
import { DateFormat } from "../../../../shared/util/date-format.model";

export interface Organization {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: Address;
  description?: string;
  createdat?: Date;
  updatedat?: Date;
  userid: string;
  branches: Branch[];
}

export interface OrganizationBootstrap {
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
}

export interface OrganizationBootstrapFormData {
  name: string;
  email: string;
  mobile?: string;
  address: Address;
  description?: string;
  country: Country;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  fiscaldaterange: string[];
  gstin?: string;
  invnumber: string;
  currency: Currency;
  jnumber: string;
  dateformatForm?: DateFormat;
}