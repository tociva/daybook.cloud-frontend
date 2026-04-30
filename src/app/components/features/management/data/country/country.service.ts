import { Injectable } from '@angular/core';
import { Country } from './country.model';

@Injectable({ providedIn: 'root' })
export class CountryService {
  async loadCountries(): Promise<readonly Country[]> {
    const response = await fetch('/assets/data/country-list.json');
    if (!response.ok) {
      throw new Error(`Unable to load countries (${response.status})`);
    }

    const countries = (await response.json()) as readonly Country[];

    return Array.isArray(countries) ? countries : [];
  }
}

