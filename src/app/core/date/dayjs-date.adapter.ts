import {
  type TngDateAdapter,
} from '@tailng-ui/primitives';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(customParseFormat);
dayjs.extend(updateLocale);

const withLocale = (value: dayjs.Dayjs, locale?: string): dayjs.Dayjs =>
  locale ? value.locale(locale) : value;

export const dayjsDatepickerDateAdapter: TngDateAdapter<dayjs.Dayjs> = Object.freeze({
  addDays: (date, amount) => date.add(amount, 'day'),
  addMonths: (date, amount) => date.add(amount, 'month'),
  addYears: (date, amount) => date.add(amount, 'year'),
  compare: (left, right) => {
    const leftValue = left.valueOf();
    const rightValue = right.valueOf();
    if (leftValue < rightValue) {
      return -1;
    }
    if (leftValue > rightValue) {
      return 1;
    }
    return 0;
  },
  createDate: (year, month, day) => dayjs().year(year).month(month).date(day).startOf('day'),
  deserialize: (value, locale) => {
    if (dayjs.isDayjs(value)) {
      return withLocale(value.startOf('day'), locale);
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return withLocale(dayjs(value).startOf('day'), locale);
    }
    if (typeof value === 'string') {
      const parsed = dayjs(value, ['YYYY-MM-DD', 'YYYY/MM/DD'], true);
      return parsed.isValid() ? withLocale(parsed.startOf('day'), locale) : null;
    }
    return null;
  },
  endOfMonth: (date) => date.endOf('month').startOf('day'),
  format: (date, format, locale) => withLocale(date, locale).format(format),
  getDate: (date) => date.date(),
  getDay: (date) => date.day(),
  getMonth: (date) => date.month(),
  getYear: (date) => date.year(),
  isValid: (date) => date.isValid(),
  parse: (text, locale) => {
    const parsed = dayjs(text, ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY'], true);
    return parsed.isValid() ? withLocale(parsed.startOf('day'), locale) : null;
  },
  startOfMonth: (date) => date.startOf('month'),
  startOfWeek: (date, weekStartsOn) => {
    const current = date.day();
    const offset = (current - weekStartsOn + 7) % 7;
    return date.subtract(offset, 'day').startOf('day');
  },
  today: () => dayjs().startOf('day'),
});
