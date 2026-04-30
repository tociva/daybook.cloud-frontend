import { Currency } from './currency.model';

export type CurrencyState = Readonly<{
  currencies: readonly Currency[];
  error: string | null;
  isLoading: boolean;
}>;

export const initialCurrencyState: CurrencyState = {
  currencies: [],
  error: null,
  isLoading: false,
};

