import type { BankTxn } from './bank-txn.model';

export type BankTxnState = Readonly<{
  bankTxn: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly BankTxn[];
    selectedItem: BankTxn | null;
  }>;
}>;

export const initialBankTxnState: BankTxnState = {
  bankTxn: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
