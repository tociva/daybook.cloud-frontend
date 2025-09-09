import { Status } from '../../../../../util/types/status.type';
import { FiscalYear } from '../../../management/store/fiscal-year/fiscal-year.model';
import { LedgerCategory } from '../ledger-category/ledger-category.model';

export interface LedgerCU {
  name: string;
  description?: string;
  openingdr?: number;
  openingcr?: number;
  props?: Record<string, unknown>;
  categoryid: string;
}

export interface Ledger extends LedgerCU {
  id?: string;
  category: LedgerCategory;
}
