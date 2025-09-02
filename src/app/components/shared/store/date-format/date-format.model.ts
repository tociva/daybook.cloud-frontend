export interface DateFormat {
  name: string;
  example: string;
}

export interface DateFormatState {
  dateFormats: DateFormat[];
  loaded: boolean;
  error: string | null;
  search: string;
} 