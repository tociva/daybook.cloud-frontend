import type { ContraTransaction } from './contra-transaction.model';

export type ContraTransactionState = Readonly<{
  contraTransaction: Readonly<{
    count: number;
    error: string | null;
    isLoading: boolean;
    items: readonly ContraTransaction[];
    selectedItem: ContraTransaction | null;
  }>;
}>;

export const initialContraTransactionState: ContraTransactionState = {
  contraTransaction: {
    count: 0,
    error: null,
    isLoading: false,
    items: [],
    selectedItem: null,
  },
};
