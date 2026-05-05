import type { Lb4ListQuery } from '../../../../../shared/crud';

export type CustomerAddress = Readonly<{
  name: string;
  line1: string;
  line2?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}>;

export type CustomerPayload = Readonly<{
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  countrycode: string;
  currencycode: string;
  state?: string;
  description?: string;
  address: CustomerAddress;
  status?: number;
}>;

export type Customer = CustomerPayload &
  Readonly<{
    id?: string;
    branchid?: string;
  }>;

export type CustomerListQuery = Lb4ListQuery;
export type CustomerGetQuery = Readonly<{ includes?: readonly string[] }>;
