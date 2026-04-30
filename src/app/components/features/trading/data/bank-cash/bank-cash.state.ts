import type { BankCash } from './bank-cash.model';

export type BankCashState = Readonly<{
  bankCash: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly BankCash[];
    selectedItem: BankCash | null;
  }>;
}>;

export const initialBankCashState: BankCashState = {
  bankCash: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};

