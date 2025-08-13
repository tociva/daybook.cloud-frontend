import { Branch } from '../../../management/store/branch/branch.model';


export interface BankCashCU {
  name: string;
  status?: number;
  description?: string;
  props?: { ledger?: string } & Record<string, unknown>;
}

export interface BankCash extends BankCashCU {
  id?: string;
  branch: Branch;
  branchid: string;
}