import type { Lb4ListQuery } from '../../../../../shared/crud';
import type { LedgerCategory } from '../ledger-category/ledger-category.model';

export type LedgerPayload = Readonly<{
  name: string;
  categoryid: string;
  description?: string;
  openingdr?: number;
  openingcr?: number;
}>;

export type Ledger = LedgerPayload &
  Readonly<{
    id?: string;
    category?: LedgerCategory;
  }>;

export type LedgerListQuery = Lb4ListQuery;

export type LedgerGetQuery = Readonly<{
  includes?: readonly string[];
}>;
