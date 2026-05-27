import type { Country } from '../country/country.model';
import type { Currency } from '../currency/currency.model';
import type { DateFormat } from '../date-format/date-format.model';
import type { Branch } from '../branch/branch.model';
import type { Address } from '../../../../../util/types/address';
import type { Lb4ListQuery } from '../../../../../shared/crud';

export type Organization = Readonly<{
  id?: string;
  name: string;
  email: string;
  mobile?: string;
  address?: Address;
  description?: string;
  smalllogodocumentid?: string | null;
  normallogodocumentid?: string | null;
  createdat?: Date;
  updatedat?: Date;
  userid: string;
  branches: readonly Branch[];
}>;

export type OrganizationLogoVariant = 'small' | 'normal';

export type OrganizationLogoDocument = Readonly<{
  id?: string;
  name: string;
  path?: string;
  size: number;
  type?: string;
  category?: string;
  status?: string;
  addedbyid?: string;
  organizationid?: string;
  createdat?: string;
  updatedat?: string;
  putUrl?: string;
}>;

export type OrganizationLogoReadUrl = OrganizationLogoDocument &
  Readonly<{
    getUrl: string;
    expiresIn: number;
  }>;

export type OrganizationLogoUploadPayload = Readonly<{
  name: string;
  type: string;
  size: number;
}>;

export type OrganizationBootstrap = Readonly<{
  name: string;
  email: string;
  mobile?: string;
  address: OrgAddress;
  description?: string;
  countrycode: string;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  startdate: string;
  enddate: string;
  gstin?: string;
  invnumber: string;
  recnumber: string;
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
  recnumber: string;
  currency: Currency;
  jnumber: string;
  dateformatForm?: DateFormat;
}>;

export type OrgAddress = Readonly<{
  line1: string;
  line2?: string;
  city?: string;
  pincode?: string;
}>;

export type OrganizationPayload = Readonly<{
  name: string;
  email: string;
  mobile?: string;
  description?: string;
  countrycode?: string;
  state?: string;
  gstin?: string;
  address?: OrgAddress;
}>;

export type OrganizationListQuery = Lb4ListQuery;
