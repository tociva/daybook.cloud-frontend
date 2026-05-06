import type { Country } from '../country/country.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import type { Organization } from '../organization/organization.model';
import type { Address } from '../../../../../util/types/address';
import type { Lb4ListQuery } from '../../../../../shared/crud';

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

export type BranchAddress = Readonly<{
  line1: string;
  line2?: string;
  city?: string;
  pincode?: string;
}>;

export type BranchPayload = Readonly<{
  name: string;
  email: string;
  organizationid: string;
  countrycode: string;
  currencycode: string;
  fiscalstart: string;
  dateformat: string;
  timezone: string;
  invnumber: string;
  mobile?: string;
  description?: string;
  state?: string;
  gstin?: string;
  address?: BranchAddress;
}>;

export type BranchListQuery = Lb4ListQuery;
export type BranchGetQuery = Readonly<{ includes?: readonly string[] }>;

