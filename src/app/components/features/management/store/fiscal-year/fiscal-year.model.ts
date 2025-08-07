import { Currency } from "../../../../shared/store/currency/currency.model";
import { Branch } from "../branch/branch.model";

export interface FiscalYear {
  id?: string;
  name: string;
  startdate: string;
  enddate: string;
  freezetill?: Date | null;
  jnumber: string;
  currency: Currency;
  branchid: string;
  branch: Branch;
}