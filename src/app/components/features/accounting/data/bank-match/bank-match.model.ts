export type BankMatch = Readonly<{
  id?: string;
  banktxnid: string;
  journalid: string;
  matchedamount: number;
  props?: Record<string, unknown>;
}>;

export type BankMatchCreatePayload = Readonly<{
  banktxnid: string;
  journalid: string;
  matchedamount: number;
  props?: Record<string, unknown>;
}>;
