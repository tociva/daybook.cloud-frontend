export interface SearchItem {
  displayValue: string;
  value: string;
  query?: string;
  type: 'url' | 'search';
  route?: string;
}

export interface SearchItemStateModel {
  currentTitle: string | null;
  query: string | null;
  items: SearchItem[];
}
