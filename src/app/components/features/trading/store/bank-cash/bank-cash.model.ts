import { Status } from '../../../../../util/types/status.type';
import { Branch } from '../../../management/store/branch/branch.model';


export interface BankCashCU {
  name: string;
  status?: Status;
  description?: string;
  props?: { ledger?: string } & Record<string, unknown>;
}

export interface BankCash extends BankCashCU {
  id?: string;
  branch: Branch;
  branchid: string;
}