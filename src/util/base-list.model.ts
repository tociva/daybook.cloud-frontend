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
  error: unknown | null;
  count: number;
  page: number;
}