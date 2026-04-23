import { FiscalYear } from '../../../management/store/fiscal-year/fiscal-year.model';
import { BankCashLedgerMap } from '../bank-ledger-map/bank-ledger-map.model';

export interface BankTxnCU {
  bankcashledgermapid: string;
  txndate: Date | string;
  description?: string;
  debit?: number;
  credit?: number;
  bankref?: string;
  props?: Record<string, unknown>;
}

export interface BankTxn extends BankTxnCU {
  id?: string;
  bankcashledgermap?: BankCashLedgerMap;
  fiscalyear?: FiscalYear;
  matches?: unknown[]; // BankMatch[] - placeholder
}


