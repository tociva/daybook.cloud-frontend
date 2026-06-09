import type { Lb4Include, Lb4ListQuery } from '../../../../../shared/crud';
import type { JournalCreatePayload } from '../journal';
import type { InventoryLedgerMap } from '../inventory-ledger-map';

export type BankMatch = Readonly<Record<string, unknown>>;

export type BankTxnJournal = Readonly<{
  id: string;
  number: string;
}>;

export type BankTxnProps = Readonly<Record<string, unknown>>;

export type BankTxnPayload = Readonly<{
  inventoryledgermapid: string;
  txndate: string;
  description?: string;
  debit?: number;
  credit?: number;
  bankref?: string;
  props?: BankTxnProps;
}>;

export type BankTxn = BankTxnPayload &
  Readonly<{
    id?: string;
    fiscalyearid?: string;
    balance?: number;
    journals?: readonly BankTxnJournal[];
    matches?: readonly BankMatch[];
    inventoryledgermap?: InventoryLedgerMap;
  }>;

export type BankTxnListQuery = Lb4ListQuery;

export type BankTxnGetQuery = Readonly<{
  includes?: readonly Lb4Include[];
}>;

export type BankTxnJournalCreatePayload = Readonly<
  JournalCreatePayload & {
    matchedamount: number;
    matchprops?: Record<string, unknown>;
  }
>;
