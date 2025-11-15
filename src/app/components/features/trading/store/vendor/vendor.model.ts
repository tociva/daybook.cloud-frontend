import { Status } from '../../../../../util/types/status.type';
import { Address } from '../../../../../util/types/address';
import { Branch } from '../../../management/store/branch/branch.model';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { Country } from '../../../../shared/store/country/country.model';

export interface VendorCU {
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address: Address;
  countrycode: string;
  state?: string;
  currencycode: string;
  description?: string;
  props?: { ledger?: string } & Record<string, unknown>;
  status?: Status;
}

export interface Vendor extends VendorCU {
  id?: string;
  branch: Branch;
  country?: Country;
  currency?: Currency;
  branchid: string;
}

export interface VendorBulkRequestItem {
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  address: Address;
  countrycode: string;
  state?: string;
  currencycode: string;
  description?: string;
}

export interface VendorBulkRequest {
  vendors: VendorBulkRequestItem[];
}
