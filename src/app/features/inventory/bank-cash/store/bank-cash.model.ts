export interface BankCash {
  id?: string;
  name: string;
  status?: number;
  description?: string;
  props?: {
    ledger?: string;
    [key: string]: unknown;
  };
  branchid: string;
}

export interface BankCashState {
  bankCashList: BankCash[];
  selectedBankCash: BankCash | null;
  count: number;
  error: unknown;
}
