export interface DateFormat {
  name: string;
  value: string;
}

export interface DateFormatState {
  dateFormats: DateFormat[];
  loaded: boolean;
  error: string | null;
  search: string;
} 