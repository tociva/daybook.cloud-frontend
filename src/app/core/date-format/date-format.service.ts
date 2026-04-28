import { Injectable } from '@angular/core';
import { DateFormat } from './date-format.model';

@Injectable({ providedIn: 'root' })
export class DateFormatService {
  async loadDateFormats(): Promise<readonly DateFormat[]> {
    const response = await fetch('/assets/data/date-format-list.json');
    if (!response.ok) {
      throw new Error(`Unable to load date formats (${response.status})`);
    }

    const dateFormats = (await response.json()) as readonly DateFormat[];
    return Array.isArray(dateFormats) ? dateFormats : [];
  }
}

