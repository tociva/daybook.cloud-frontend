import type { Country } from '../country/country.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import type { Organization } from '../organization/organization.model';
import type { Address } from '../../util/types/address';

export type Branch = Readonly<{
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
  fiscalyears: readonly FiscalYear[];
  createdat?: Date;
  updatedat?: Date;
  userid: string;
}>;

