import { Status } from '../../../../../util/types/status.type';
import { Address } from '../../../../../util/types/address';
import { Branch } from '../../../management/store/branch/branch.model';
import { Currency } from '../../../../shared/store/currency/currency.model';
import { Country } from '../../../../shared/store/country/country.model';

export interface CustomerCU {
  name: string;
  mobile?: string;
  email?: string;
  gstin?: string;
  address: Address;
  countrycode: string;
  state?: string;
  currencycode: string;
  description?: string;
  props?: { ledger?: string } & Record<string, unknown>;
  status?: Status;
}

export interface Customer extends CustomerCU {
  id?: string;
  branch: Branch;
  country?: Country;
  currency?: Currency;
  branchid: string;
}
