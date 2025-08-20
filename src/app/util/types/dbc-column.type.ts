
export interface DbcColumn<T> {
  header: string;
  key: keyof T | string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'action' | 'status';
  sortable?: boolean;
}