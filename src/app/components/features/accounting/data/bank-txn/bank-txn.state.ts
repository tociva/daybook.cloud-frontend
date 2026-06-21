import type { BankTxn, BankTxnListPeriod, BankTxnOpeningBalance } from './bank-txn.model';

export type BankTxnState = Readonly<{
  bankTxn: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly BankTxn[];
    openingBalances: readonly BankTxnOpeningBalance[];
    period: BankTxnListPeriod | null;
    selectedItem: BankTxn | null;
  }>;
}>;

export const initialBankTxnState: BankTxnState = {
  bankTxn: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    openingBalances: [],
    period: null,
    selectedItem: null,
  },
};
