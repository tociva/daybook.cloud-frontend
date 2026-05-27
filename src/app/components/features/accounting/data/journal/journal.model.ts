import type { Lb4ListQuery } from '../../../../../shared/crud';

/** Full journal as returned by GET / list when included. */
export type JournalEntry = Readonly<{
  id?: string;
  order?: number;
  ledgerid: string;
  debit?: number;
  credit?: number;
  journalid?: string;
}>;

export type Journal = Readonly<{
  id: string;
  number: string;
  date: string;
  description?: string;
  props?: Record<string, unknown>;
  fiscalyearid: string;
  documentids?: readonly string[];
  entries?: readonly JournalEntry[];
  createdat?: string;
  updatedat?: string;
}>;

/** POST body — `number` optional (server auto-generates). */
export type JournalEntryCreatePayload = Readonly<
  { ledgerid: string } & ({ debit: number; credit?: never } | { credit: number; debit?: never })
>;

export type JournalCreatePayload = Readonly<{
  number?: string;
  date: string;
  description?: string;
  props?: Record<string, unknown>;
  entries: readonly JournalEntryCreatePayload[];
}>;

/** PATCH body — partial header; if `entries` is sent non-empty, server replaces all lines. */
export type JournalUpdatePayload = Readonly<{
  number?: string;
  date?: string;
  description?: string;
  props?: Record<string, unknown>;
  entries?: readonly JournalEntryCreatePayload[];
}>;

export type JournalListQuery = Lb4ListQuery;

export type JournalGetQuery = Readonly<{
  includes?: readonly string[];
}>;

export type JournalWritePayload = JournalCreatePayload;
