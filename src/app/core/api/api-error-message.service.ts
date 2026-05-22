import { Injectable, InjectionToken, inject } from '@angular/core';
import { ApiErrorParams } from './api-error.model';
import { interpolateApiErrorMessage } from './api-error.util';

export const API_ERROR_TRANSLATIONS = new InjectionToken<Record<string, string>>(
  'API_ERROR_TRANSLATIONS',
  {
    factory: () => ({}),
  },
);

@Injectable({ providedIn: 'root' })
export class ApiErrorMessageService {
  private readonly translations = inject(API_ERROR_TRANSLATIONS);

  translate(messageKey: string, params?: ApiErrorParams, _locale?: string): string | null {
    const template = this.translations[messageKey];
    return template ? interpolateApiErrorMessage(template, params) : null;
  }
}
