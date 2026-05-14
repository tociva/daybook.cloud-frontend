import { computed, inject, Injectable } from '@angular/core';
import { UserSessionStore } from '../../components/features/management/data/user-session/user-session.store';
import { DEFAULT_DISPLAY_DATE_FORMAT, parseIsoDate } from './dayjs-date.utils';

type BranchDateFormatSource = Readonly<{
  dateformat?: string;
  dateFormatString?: string;
  'date-format-string'?: string;
}>;

@Injectable({ providedIn: 'root' })
export class DateManagementService {
  private readonly userSessionStore = inject(UserSessionStore);

  readonly displayDateFormat = computed(() => {
    const branch = this.userSessionStore.session()?.branch as
      | BranchDateFormatSource
      | null
      | undefined;
    const branchDateFormat = (
      branch?.['date-format-string'] ??
      branch?.dateFormatString ??
      branch?.dateformat
    )?.trim();
    return branchDateFormat || DEFAULT_DISPLAY_DATE_FORMAT;
  });

  formatDisplayDate(value: string | null | undefined, fallback = '-'): string {
    if (!value) {
      return fallback;
    }

    const parsed = parseIsoDate(value);
    if (!parsed) {
      return fallback;
    }

    return parsed.format(this.displayDateFormat());
  }
}
