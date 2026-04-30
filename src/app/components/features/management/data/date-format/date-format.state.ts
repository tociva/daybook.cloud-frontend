import { DateFormat } from './date-format.model';

export type DateFormatState = Readonly<{
  dateFormats: readonly DateFormat[];
  error: string | null;
  isLoading: boolean;
}>;

export const initialDateFormatState: DateFormatState = {
  dateFormats: [],
  error: null,
  isLoading: false,
};

