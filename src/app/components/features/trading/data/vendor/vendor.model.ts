import type { Lb4ListQuery } from '../../../../../shared/crud';

export type VendorAddress = Readonly<{
  name: string;
  line1: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}>;

export type VendorPayload = Readonly<{
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  countrycode: string;
  currencycode: string;
  state?: string;
  description?: string;
  address: VendorAddress;
  status?: number;
}>;

export type Vendor = VendorPayload &
  Readonly<{
    id?: string;
    branchid?: string;
  }>;

export type VendorListQuery = Lb4ListQuery;
export type VendorGetQuery = Readonly<{ includes?: readonly string[] }>;
