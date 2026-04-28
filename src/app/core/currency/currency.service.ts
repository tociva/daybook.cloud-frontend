import { Injectable } from '@angular/core';
import { Currency } from './currency.model';

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  async loadCurrencies(): Promise<readonly Currency[]> {
    const response = await fetch('/assets/data/currency-list.json');
    if (!response.ok) {
      throw new Error(`Unable to load currencies (${response.status})`);
    }

    const currencies = (await response.json()) as readonly Currency[];
    return Array.isArray(currencies) ? currencies : [];
  }
}

