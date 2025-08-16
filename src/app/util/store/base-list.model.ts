import { DbcError } from "../types/dbc-error.type";


export interface BaseListModel<T> {
  items: T[];
  count: number;
  error: DbcError | null;
}