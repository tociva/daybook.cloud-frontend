import { computed, inject, Injectable } from '@angular/core';
import { createDayjsDatepickerDateAdapter } from './dayjs-date.adapter';
import { DateManagementService } from './date-management.service';

@Injectable({ providedIn: 'root' })
export class DatepickerDateAdapterService {
  private readonly dateManagement = inject(DateManagementService);

  readonly adapter = computed(() =>
    createDayjsDatepickerDateAdapter(this.dateManagement.displayDateFormat()),
  );
}
