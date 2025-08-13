import { bootstrapCalendarMonth, bootstrapChevronDown, bootstrapList, bootstrapTextIndentRight } from '@ng-icons/bootstrap-icons';
import { provideIcons } from '@ng-icons/core';


export const provideAppIcons = () =>
  provideIcons({
    bootstrapTextIndentRight, bootstrapList, bootstrapChevronDown, bootstrapCalendarMonth
  });
