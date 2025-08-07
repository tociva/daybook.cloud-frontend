import { CurrencyState } from "./currency.model";

export const initialCurrencyState: CurrencyState = {
  currencies: [],
  loaded: false,
  error: null,
  search: '',
}; 