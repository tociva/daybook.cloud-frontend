import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BankCashState } from './bank-cash.model';

export const selectBankCashState = createFeatureSelector<BankCashState>('bankCash');

export const selectAllBankCash = createSelector(
  selectBankCashState,
  state => state.bankCashList
);

export const selectSelectedBankCash = createSelector(
  selectBankCashState,
  state => state.selectedBankCash
);

export const selectBankCashCount = createSelector(
  selectBankCashState,
  state => state.count
);

export const selectBankCashError = createSelector(
  selectBankCashState,
  state => state.error
);
