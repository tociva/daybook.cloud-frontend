import { Country } from './country.model';

export type CountryState = Readonly<{
  countries: readonly Country[];
  error: string | null;
  isLoading: boolean;
}>;

export const initialCountryState: CountryState = {
  countries: [],
  error: null,
  isLoading: false,
};

