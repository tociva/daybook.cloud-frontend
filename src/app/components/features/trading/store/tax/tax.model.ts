import { Status } from '../../../../../util/types/status.type';
import { Branch } from '../../../management/store/branch/branch.model';

export interface TaxCU {
  name: string;
  shortname: string;
  description?: string;
  rate: number;
  appliedto: number;
  status?: Status;
}

export interface Tax extends TaxCU {
  id?: string;
  branch: Branch;
  branchid: string;
}
