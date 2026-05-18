import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DEFAULT_NODE_DATE_FORMAT } from '../../util/constants';

dayjs.extend(customParseFormat);

export const DEFAULT_DISPLAY_DATE_FORMAT = 'DD MMM YYYY';

export const toIsoDate = (value: unknown, fallback: string): string => {
  if (dayjs.isDayjs(value) && value.isValid()) {
    return value.format(DEFAULT_NODE_DATE_FORMAT);
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return dayjs(value).format(DEFAULT_NODE_DATE_FORMAT);
  }

  if (typeof value === 'string') {
    const isoDate = parseIsoDate(value);
    if (isoDate) {
      return isoDate.format(DEFAULT_NODE_DATE_FORMAT);
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
    return isoDate.format(DEFAULT_NODE_DATE_FORMAT);
  }

  const parsed = dayjs(normalized, ['MMMM-D', 'MMMM-DD'], true);
  if (!parsed.isValid()) {
    return fallback;
  }

  return parsed.year(dayjs().year()).format(DEFAULT_NODE_DATE_FORMAT);
};

export const toDateRangeEnd = (start: string, fallback: string): string => {
  const parsedStart = parseIsoDate(start);
  if (!parsedStart) {
    return fallback;
  }

  return parsedStart.add(1, 'year').subtract(1, 'day').format(DEFAULT_NODE_DATE_FORMAT);
};

export const parseIsoDate = (value: string): dayjs.Dayjs | null => {
  const parsed = dayjs(value, DEFAULT_NODE_DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};
