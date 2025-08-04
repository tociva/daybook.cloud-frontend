import { Currency } from "../../../../../../util/types/currency";
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