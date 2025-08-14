import { DbcError } from "../types/dbc-error.type";

export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface ListQueryParams {
  limit: number;
  skip: number;
  search?: string;
  sort?: SortConfig | null;
  filters?: Record<string, any>;
}

export interface BaseListModel<T> extends ListQueryParams {
  items: T[];
  error: DbcError | null;
  count: number;
  page: number;
}