export const JOURNAL_LINK_WORK_ITEM_DEFAULT_LIMIT = 50;
export const JOURNAL_LINK_WORK_ITEM_MAX_LIMIT = 200;

export const JOURNAL_LINK_WORK_ITEM_SOURCE_TYPES = [
  'sale_invoice',
  'purchase_invoice',
  'receipt',
  'payment',
  'bank_txn',
  'contra',
] as const;

export const JOURNAL_LINK_WORK_ITEM_STATUSES = [
  'not_fully_linked',
  'unlinked',
  'partial',
  'linked',
  'all',
] as const;

export const JOURNAL_LINK_WORK_ITEM_ORDER_FIELDS = [
  'sourceType',
  'date',
  'number',
  'partyName',
  'sourceAmount',
  'matchedAmount',
  'pendingAmount',
  'linkStatus',
] as const;

export const JOURNAL_LINK_WORK_ITEM_QUERY_KEYS = [
  'sourceType',
  'status',
  'fromDate',
  'toDate',
  'limit',
  'skip',
  'order',
] as const;

export const JOURNAL_LINK_WORK_ITEM_CLEAR_QUERY_PARAMS = [
  ...JOURNAL_LINK_WORK_ITEM_QUERY_KEYS,
  'dashboardAction',
] as const;

export type JournalLinkWorkItemSourceType =
  (typeof JOURNAL_LINK_WORK_ITEM_SOURCE_TYPES)[number];

export type JournalLinkWorkItemStatus = (typeof JOURNAL_LINK_WORK_ITEM_STATUSES)[number];

export type JournalLinkWorkItemOrderField =
  (typeof JOURNAL_LINK_WORK_ITEM_ORDER_FIELDS)[number];

export type JournalLinkWorkItemLinkStatus = 'unlinked' | 'partial' | 'linked';

export type JournalLinkWorkItemQuery = Readonly<{
  sourceType?: JournalLinkWorkItemSourceType;
  status?: JournalLinkWorkItemStatus;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  skip?: number;
  order?: string;
}>;

export type JournalLinkWorkItemJournal = Readonly<{
  id: string;
  number: string;
}>;

export type JournalLinkWorkItem = Readonly<{
  sourceType: JournalLinkWorkItemSourceType;
  sourceId: string;
  date: string;
  number: string | null;
  partyName: string | null;
  sourceAmount: number;
  matchedAmount: number;
  pendingAmount: number;
  linkStatus: JournalLinkWorkItemLinkStatus;
  journals: readonly JournalLinkWorkItemJournal[];
}>;

export type JournalLinkWorkItemCountResponse =
  | number
  | Readonly<{
      count: number;
    }>;
