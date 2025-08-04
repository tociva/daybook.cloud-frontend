import { Address } from "../../../../../../util/types/address";
import { Country } from "../../../../../../util/types/country";
import { Currency } from "../../../../../../util/types/currency";
import { Branch } from "../branch/branch.model";

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
  address?: Address;
  description?: string;
  country?: Country;
  state?: string;
  fiscalstart: string;
  fiscalname: string;
  startdate: string;
  enddate: string;
  gstin?: string;
  invnumber?: string;
  currency?: Currency;
  jnumber?: string;
}