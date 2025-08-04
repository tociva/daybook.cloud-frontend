import { Address } from "../../../../../../util/types/address";
import { Country } from "../../../../../../util/types/country";
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
  gstin?: string;
  invnumber: string;
  organization: Organization;
  organizationid: string;
  fiscalyears: FiscalYear[];
  createdat?: Date;
  updatedat?: Date;
  userid: string;
}