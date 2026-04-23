import { FiscalYear } from '../../../management/store/fiscal-year/fiscal-year.model';
import { Ledger } from '../ledger/ledger.model';
import { BankCash } from '../../../trading/store/bank-cash/bank-cash.model';

export interface BankCashLedgerMapCU {
  fiscalyearid?: string;
  bankcashid: string;
  ledgerid: string;
  props?: Record<string, unknown>;
}

export interface BankCashLedgerMap extends BankCashLedgerMapCU {
  id?: string;
  fiscalyear?: FiscalYear;
  bankcash?: BankCash;
  ledger?: Ledger;
}

