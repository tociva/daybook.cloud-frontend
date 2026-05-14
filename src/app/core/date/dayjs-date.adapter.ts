import {
  defaultDatepickerDateAdapter,
  type TngDateAdapter,
  type TngDateFormatToken,
} from '@tailng-ui/primitives';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import { DEFAULT_DISPLAY_DATE_FORMAT } from './dayjs-date.utils';

dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);

function resolveDatepickerFormat(
  format: TngDateFormatToken | string,
  inputDateFormat: string,
): string {
  switch (format) {
    case 'input':
      return inputDateFormat;
    case 'label':
      return 'D MMMM YYYY';
    case 'month-year':
      return 'MMMM YYYY';
    case 'month-long':
      return 'MMMM';
    case 'month-short':
      return 'MMM';
    case 'weekday-short':
      return 'ddd';
    case 'weekday-narrow':
      return 'dd';
    case 'day-number':
      return 'D';
    case 'year-label':
      return 'YYYY';
    default:
      return format;
  }
}

export function createDayjsDatepickerDateAdapter(
  inputDateFormat = DEFAULT_DISPLAY_DATE_FORMAT,
): TngDateAdapter<Date> {
  const inputFormats = Array.from(
    new Set([
      inputDateFormat,
      DEFAULT_DISPLAY_DATE_FORMAT,
      'YYYY-MM-DD',
      'YYYY/MM/DD',
      'DD/MM/YYYY',
      'MM/DD/YYYY',
    ]),
  );

  return Object.freeze({
    ...defaultDatepickerDateAdapter,
    deserialize: (value, locale) => {
      if (typeof value === 'string') {
        const parsed = dayjs(value, inputFormats, true);
        if (parsed.isValid()) {
          return defaultDatepickerDateAdapter.createDate(
            parsed.year(),
            parsed.month(),
            parsed.date(),
          );
        }
      }

      return defaultDatepickerDateAdapter.deserialize?.(value, locale) ?? null;
    },
    format: (date, format, locale) =>
      dayjs(date)
        .locale(locale ?? 'en')
        .format(resolveDatepickerFormat(format, inputDateFormat)),
    parse: (text, locale) => {
      const parsed = dayjs(text, inputFormats, true);
      if (parsed.isValid()) {
        return defaultDatepickerDateAdapter.createDate(
          parsed.year(),
          parsed.month(),
          parsed.date(),
        );
      }

      return defaultDatepickerDateAdapter.parse(text, locale);
    },
  });
}

export const dayjsDatepickerDateAdapter: TngDateAdapter<Date> = createDayjsDatepickerDateAdapter();
