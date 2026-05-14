import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export const DEFAULT_DISPLAY_DATE_FORMAT = 'DD MMM YYYY';

export const toIsoDate = (value: unknown, fallback: string): string => {
  if (dayjs.isDayjs(value) && value.isValid()) {
    return value.format('YYYY-MM-DD');
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dayjs(value).format('YYYY-MM-DD');
  }

  if (typeof value === 'string') {
    const isoDate = parseIsoDate(value);
    if (isoDate) {
      return isoDate.format('YYYY-MM-DD');
    }
  }

  return fallback;
};

export const toDateRangeStartFromFiscalStart = (fiscalStart: string, fallback: string): string => {
  const normalized = fiscalStart.trim();
  if (normalized.length === 0) {
    return fallback;
  }

  const isoDate = parseIsoDate(normalized);
  if (isoDate) {
    return isoDate.format('YYYY-MM-DD');
  }

  const parsed = dayjs(normalized, ['MMMM-D', 'MMMM-DD'], true);
  if (!parsed.isValid()) {
    return fallback;
  }

  return parsed.year(dayjs().year()).format('YYYY-MM-DD');
};

export const toDateRangeEnd = (start: string, fallback: string): string => {
  const parsedStart = parseIsoDate(start);
  if (!parsedStart) {
    return fallback;
  }

  return parsedStart.add(1, 'year').subtract(1, 'day').format('YYYY-MM-DD');
};

export const parseIsoDate = (value: string): dayjs.Dayjs | null => {
  const parsed = dayjs(value, 'YYYY-MM-DD', true);
  return parsed.isValid() ? parsed : null;
};
