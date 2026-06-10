export type ReconciliationMatch = Readonly<{
  id: string;
  sourcetype: string;
  sourceid: string;
  journalid: string;
  fiscalyearid: string;
  matchedamount: number;
  props?: Record<string, unknown>;
  createdat?: string;
  updatedat?: string;
}>;

export type ReconciliationMatchLinkPayload = Readonly<{
  matchedamount: number;
  matchprops?: Record<string, unknown>;
}>;

export type ReconciliationMatchLinkAssignment = Readonly<{
  journalId: string;
  matchedamount: number;
  matchprops?: Record<string, unknown>;
}>;
