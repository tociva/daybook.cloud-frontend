import { Address } from "../../../../../util/types/address";
import { Country } from "../../../../shared/store/country/country.model";
import { FiscalYear } from "../fiscal-year/fiscal-year.model";
import { Organization } from "../organization/organization.model";

export interface Branch {
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: Address;
  country?: Country;
  state?: string;
  description?: string;
  fiscalstart: string;
  dateformat: string;
  timezone: string;
  gstin?: string;
  invnumber: string;
  organization: Organization;
  organizationid: string;
  currencycode: string;
  countrycode: string;
  fiscalyears: FiscalYear[];
  createdat?: Date;
  updatedat?: Date;
  userid: string;
}